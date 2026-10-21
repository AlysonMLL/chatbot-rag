"""
TabulaRAG - Backend (FastAPI)

Fluxo:
  1. POST /api/upload   -> lê o arquivo, consolida se necessário e guarda na RAM (file_id).
  2. POST /api/chat     -> agente do pandas (LangChain) responde sobre o arquivo do file_id.
  3. DELETE /api/files/{file_id} -> libera a memória quando o usuário troca de arquivo.

LLM: Gemini (via API compatível com a OpenAI), configurado pelo .env (LLM_*).
Rodar com UM worker: os arquivos ficam na memória do processo.
"""
import io
import os
import sys
import traceback
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from preparo import gerar_contexto, preparar_dataframe
from sessoes import SessaoStore

load_dotenv()

# ---------------------------------------------------------------- configuração
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
SESSAO_TTL_MIN = int(os.getenv("SESSAO_TTL_MIN", "30"))
MAX_SESSOES = int(os.getenv("MAX_SESSOES", "20"))
MAX_MEMORIA_MB = int(os.getenv("MAX_MEMORIA_MB", "300"))
ALLOWED_EXTENSIONS = {".csv", ".xls", ".xlsx", ".json"}
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

store = SessaoStore(
    ttl_segundos=SESSAO_TTL_MIN * 60,
    max_sessoes=MAX_SESSOES,
    limite_mb_total=MAX_MEMORIA_MB,
)

app = FastAPI(title="TabulaRAG API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------- modelos
class ChatMessage(BaseModel):
    role: str  # "user" ou "assistant"
    content: str


class ChatRequest(BaseModel):
    file_id: str
    question: str = Field(max_length=1000)
    history: list[ChatMessage] = []


# --------------------------------------------------------------------- helpers
def extensao_valida(nome: str) -> str:
    ext = Path(nome or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use CSV, XLS, XLSX ou JSON.")
    return ext


def corrigir_formato(_erro) -> str:
    return (
        "Formato inválido. Responda SEMPRE em um destes dois formatos, sem blocos de código com crases:\n"
        "(1) para executar código:\n"
        "Thought: <o que vou verificar>\n"
        "Action: python_repl_ast\n"
        "Action Input: <uma linha de código Python, sem crases>\n"
        "(2) quando já tiver o resultado:\n"
        "Thought: I now know the final answer\n"
        "Final Answer: <resposta completa em português>"
    )


def criar_agente(df: pd.DataFrame, modelo: str, contexto: str):
    llm = ChatOpenAI(
        model=modelo,
        api_key=os.getenv("LLM_API_KEY"),
        base_url=os.getenv("LLM_BASE_URL"),
        temperature=0.1,
        timeout=60,
        max_retries=1,
    )
    return create_pandas_dataframe_agent(
        llm,
        df,
        verbose=True,
        allow_dangerous_code=True,
        prefix=contexto,
        max_iterations=10,
        max_execution_time=90,
        number_of_head_rows=3,
        agent_executor_kwargs={"handle_parsing_errors": corrigir_formato},
    )


# ----------------------------------------------------------------------- rotas
@app.post("/api/upload")
def upload_file(file: UploadFile = File(...)):
    ext = extensao_valida(file.filename)

    limite = MAX_UPLOAD_MB * 1024 * 1024
    contents = file.file.read(limite + 1)
    if len(contents) > limite:
        raise HTTPException(status_code=413, detail=f"Arquivo maior que o limite de {MAX_UPLOAD_MB} MB.")

    try:
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        elif ext in (".xls", ".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            df = pd.read_json(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Não foi possível ler o arquivo: {e}")

    if df.empty:
        raise HTTPException(status_code=422, detail="O arquivo não tem linhas de dados.")

    try:
        df_prep, aviso = preparar_dataframe(df)
    except Exception:
        traceback.print_exc(file=sys.stderr)
        df_prep, aviso = df, None
    print(aviso or "Nenhuma consolidação de dados aplicada.", file=sys.stderr)
    contexto = gerar_contexto(df_prep, aviso)

    nome = Path(file.filename).name
    try:
        file_id = store.criar(df_prep, contexto, nome)
    except ValueError as e:
        raise HTTPException(status_code=413, detail=str(e))

    return {
        "file_id": file_id,
        "filename": nome,
        "rows": len(df),
        "columns_count": len(df.columns),
        "columns": [{"name": str(c), "type": str(t)} for c, t in df.dtypes.items()],
        "preview": df.head(4).fillna("").astype(str).values.tolist(),
        "size_mb": round(len(contents) / (1024 * 1024), 2),
        "note": aviso,
    }


@app.post("/api/chat")
def chat_with_data(request: ChatRequest):
    sessao = store.obter(request.file_id)
    if sessao is None:
        raise HTTPException(
            status_code=404,
            detail="Sessão expirada ou arquivo não encontrado. Envie o arquivo novamente.",
        )

    historico = ""
    if request.history:
        linhas = [
            f"{'Usuário' if m.role == 'user' else 'Assistente'}: {m.content[:500]}"
            for m in request.history[-6:]
        ]
        historico = (
            "Histórico recente da conversa (use para entender perguntas de acompanhamento):\n"
            + "\n".join(linhas)
            + "\n\nPergunta atual: "
        )
    pergunta = historico + request.question

    try:
        modelos = [m for m in (os.getenv("LLM_MODEL"), os.getenv("LLM_MODEL_FALLBACK")) if m]
        final_answer = None
        for modelo in modelos:
            try:
                # df.copy(): o código gerado pelo modelo não pode estragar os dados da sessão
                resultado = criar_agente(sessao.df.copy(), modelo, sessao.contexto).invoke(pergunta)
                saida = resultado.get("output") if isinstance(resultado, dict) else str(resultado)
                if not saida or "Agent stopped" in saida:
                    raise RuntimeError("O agente não conseguiu concluir a resposta.")
                final_answer = saida
                break
            except Exception as e:
                print(f"Modelo {modelo} falhou: {e}", file=sys.stderr)

        if final_answer is None:
            raise HTTPException(
                status_code=503,
                detail="O serviço de IA está sobrecarregado ou não conseguiu responder. Tente novamente em instantes.",
            )
        return {"answer": final_answer}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc(file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor IA: {e}")


@app.delete("/api/files/{file_id}")
def delete_file(file_id: str):
    store.remover(file_id)
    return {"ok": True}