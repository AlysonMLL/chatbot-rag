"""
/* O que há aqui:
- Configuração do FastAPI e rotas de Upload e Chat.
- Salvamento físico dos arquivos na pasta 'uploads/' (arquitetura robusta).
- Integração com LangChain e Google AI Studio (OpenAI API) via `create_pandas_dataframe_agent`.

Função do arquivo: Servidor e Motor de IA do TabulaRAG.
Recebe os arquivos, salva em disco para persistência segura da sessão e processa metadados.
A rota de chat carrega o arquivo do disco, injeta o DataFrame no agente do LangChain 
(Gemini (API compatível com a OpenAI)) e devolve a resposta analítica natural.
*/
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import os
import sys
import traceback
from dotenv import load_dotenv
from pathlib import Path
from preparo import preparar_dataframe, gerar_contexto

# Imports do LangChain e OpenAI
from langchain_openai import ChatOpenAI
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent

load_dotenv()

app = FastAPI(title="TabulaRAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED = {".csv", ".xls", ".xlsx", ".json"}

def safe_path(filename: str) -> Path:
    name = Path(filename).name  # descarta pastas e bloqueia "../"
    if Path(name).suffix.lower() not in ALLOWED:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado.")
    return UPLOAD_DIR / name

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = safe_path(file.filename or "")
    contents = await file.read()
    try:
        file_path.write_bytes(contents)
        ext = file_path.suffix.lower()
        if ext == ".csv":
            df = pd.read_csv(io.BytesIO(contents))
        elif ext in (".xls", ".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            df = pd.read_json(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Não foi possível ler o arquivo: {e}")

    return {
        "filename": file_path.name,
        "rows": len(df),
        "columns_count": len(df.columns),
        "columns": [{"name": c, "type": str(t)} for c, t in df.dtypes.items()],
        "preview": df.head(4).fillna("").astype(str).values.tolist(),
        "size_mb": round(len(contents) / (1024 * 1024), 2),
    }
        
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


def criar_agente(df, modelo: str, contexto: str):
    llm = ChatOpenAI(
        model=modelo,
        api_key=os.getenv("LLM_API_KEY"),
        base_url=os.getenv("LLM_BASE_URL"),
        temperature=0.1,
        timeout=60,        # corta chamadas "travadas" de ~35 s
        max_retries=1,     
    )
    return create_pandas_dataframe_agent(
        llm, df, verbose=True, allow_dangerous_code=True,
        prefix=contexto,
        max_iterations=10,
        max_execution_time=90,
        number_of_head_rows=3,
        agent_executor_kwargs={"handle_parsing_errors": corrigir_formato},
       )

class ChatMessage(BaseModel):
    role: str       # "user" ou "assistant"
    content: str

class ChatRequest(BaseModel):
    filename: str
    question: str
    history: list[ChatMessage] = []

@app.post("/api/chat")
def chat_with_data(request: ChatRequest):
    file_path = safe_path(request.filename)

    if not file_path.exists():
        print(f"ERRO 404: Arquivo esperado em {file_path} não foi encontrado.", file=sys.stderr)
        raise HTTPException(status_code=404, detail=f"Arquivo '{request.filename}' não encontrado no servidor. Por favor, faça o upload novamente.")

    try:
        ext = file_path.suffix.lower()
        if ext == ".csv":
            df = pd.read_csv(file_path)
        elif ext in (".xls", ".xlsx"):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_json(file_path)

        df, aviso = preparar_dataframe(df)
        print(aviso or "Nenhuma consolidação de dados aplicada.", file=sys.stderr)
        contexto = gerar_contexto(df, aviso)

        modelos = [m for m in (os.getenv("LLM_MODEL"), os.getenv("LLM_MODEL_FALLBACK")) if m]
        final_answer = None

        historico = ""
        if request.history:
            linhas = [
                f"{'Usuário' if m.role == 'user' else 'Assistente'}: {m.content[:500]}"
                for m in request.history[-6:]
            ]
            historico = ("Histórico recente da conversa (use para entender perguntas de acompanhamento):\n"
                         + "\n".join(linhas) + "\n\nPergunta atual: ")
        pergunta = historico + request.question

        for modelo in modelos:
            try:
                resultado = criar_agente(df.copy(), modelo, contexto).invoke(pergunta)
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