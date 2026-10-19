"""
/* O que há aqui:
- Configuração do FastAPI e rotas de Upload e Chat.
- Salvamento físico dos arquivos na pasta 'uploads/' (arquitetura robusta).
- Integração com LangChain e GitHub Models (OpenAI API) via `create_pandas_dataframe_agent`.

Função do arquivo: Servidor e Motor de IA do TabulaRAG.
Recebe os arquivos, salva em disco para persistência segura da sessão e processa metadados.
A rota de chat carrega o arquivo do disco, injeta o DataFrame no agente do LangChain 
(usando GPT-4o-mini gratuito via GitHub Models) e devolve a resposta analítica natural.
*/
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import io
import os
import sys
from dotenv import load_dotenv
from pathlib import Path

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
    return ("Formato inválido. Quando tiver a resposta, escreva exatamente: "
            "'Thought: I now know the final answer' e, na linha seguinte, "
            "'Final Answer: <resposta completa em português>'.")


def criar_agente(df, modelo: str):
    llm = ChatOpenAI(
        model=modelo,
        api_key=os.getenv("LLM_API_KEY"),
        base_url=os.getenv("LLM_BASE_URL"),
        temperature=0.1,
        timeout=20,        # corta chamadas "travadas" de ~35 s
        max_retries=2,     
    )
    return create_pandas_dataframe_agent(
        llm, df, verbose=True, allow_dangerous_code=True,
        max_iterations=10, number_of_head_rows=3,
        agent_executor_kwargs={
            "handle_parsing_errors": corrigir_formato,
            "max_execution_time": 90,
        },
    )

class ChatRequest(BaseModel):
    filename: str
    question: str

@app.post("/api/chat")
async def chat_with_data(request: ChatRequest):
    file_path = safe_path(request.filename)
    
    # Validação rigorosa com log de depuração
    if not os.path.exists(file_path):
        print(f"ERRO 404: Arquivo esperado em {file_path} não foi encontrado.", file=sys.stderr)
        raise HTTPException(status_code=404, detail=f"Arquivo '{request.filename}' não encontrado no servidor. Por favor, faça o upload novamente.")

    try:
        print(f"Carregando {file_path} para análise...", file=sys.stderr)
        if request.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif request.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        elif request.filename.endswith('.json'):
            df = pd.read_json(file_path)
        else:
            raise ValueError("Extensão de arquivo não suportada para chat.")

        print("Inicializando LangChain...", file=sys.stderr)

        modelos = [m for m in (os.getenv("LLM_MODEL"), os.getenv("LLM_MODEL_FALLBACK")) if m]
        for modelo in modelos:
            try:
                agent = criar_agente(df, modelo)
                resultado = agent.invoke(request.question)
                break
            except Exception as e:
                print(f"Modelo {modelo} falhou: {e}", file=sys.stderr)
        else:
            raise HTTPException(
                status_code=503,
                detail="O serviço de IA está sobrecarregado. Tente novamente em instantes.",
            )
        
        # llm = ChatOpenAI(
        #     model=os.getenv("LLM_MODEL"),
        #     api_key=os.getenv("LLM_API_KEY"),
        #     base_url=os.getenv("LLM_BASE_URL"),
        #     temperature=0.1,
        #     reasoning_effort="low",   # menos "pensamento" = respostas bem mais rápidas
        #     timeout=60,
        #     max_retries=1,
        # )

        # agent = create_pandas_dataframe_agent(
        #     llm,
        #     df,
        #     verbose=True,
        #     allow_dangerous_code=True,
        #     max_iterations=10,
        #     number_of_head_rows=3,
        #     agent_executor_kwargs={
        #         "handle_parsing_errors": corrigir_formato,   # em vez de True
        #         "max_execution_time": 90,                    
        #     },
        # )

        # print(f"Enviando pergunta: '{request.question}'", file=sys.stderr)
        # # O agente Pandas mais recente prefere a string direta quando não usamos ferramentas OpenAI estritas
        # resposta = agent.invoke(request.question)
        
        # O agente pode retornar um dict (com 'output') ou uma string
        final_answer = resultado.get("output") if isinstance(resultado, dict) else str(resultado)
        
        print("Resposta gerada com sucesso.", file=sys.stderr)
        return {"answer": final_answer}
        
    except Exception as e:
        print(f"\n==========================================", file=sys.stderr)
        print(f"🚨 ERRO DETALHADO NO BACKEND: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(f"==========================================\n", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor IA: {str(e)}")


