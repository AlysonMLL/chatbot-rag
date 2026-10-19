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
from dotenv import load_dotenv

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

# Cria a pasta de uploads fisicamente no projeto
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    
    try:
        # SALVA O ARQUIVO NO DISCO (Garante que a rota de chat vai achá-lo)
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as f:
            f.write(contents)

        # Lê para extrair metadados para a interface
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            return {"error": "Formato de arquivo não suportado."}

        columns_info = [{"name": col, "type": str(dtype)} for col, dtype in df.dtypes.items()]
        preview_data = df.head(4).fillna("").astype(str).values.tolist()

        return {
            "filename": file.filename,
            "rows": len(df),
            "columns_count": len(df.columns),
            "columns": columns_info,
            "preview": preview_data,
            "size_mb": round(len(contents) / (1024 * 1024), 2)
        }
        
    except Exception as e:
        return {"error": str(e)}


# Modelo Pydantic para tipar a requisição de Chat
class ChatRequest(BaseModel):
    filename: str
    question: str

@app.post("/api/chat")
async def chat_with_data(request: ChatRequest):
    file_path = os.path.join(UPLOAD_DIR, request.filename)
    
    # 1. Verifica se o arquivo existe fisicamente no disco
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no servidor. Faça o upload novamente.")

    try:
        # Lê o arquivo recém salvo no disco
        if request.filename.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif request.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file_path)
        elif request.filename.endswith('.json'):
            df = pd.read_json(file_path)

        # 2. Configura o LLM com o GitHub Models
        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=os.getenv("GITHUB_TOKEN"),
            base_url="https://models.inference.ai.azure.com", 
            temperature=0.1 
        )

        # 3. Cria o Agente do Pandas
        agent = create_pandas_dataframe_agent(
            llm,
            df,
            verbose=True, 
            allow_dangerous_code=True,
            agent_type="openai-tools"
        )

        # 4. Executa a pergunta
        resposta = agent.invoke({"input": request.question})
        
        return {"answer": resposta["output"]}
        
    except Exception as e:
        print(f"\n==========================================")
        print(f"🚨 ERRO DETALHADO NO BACKEND: {str(e)}")
        print(f"==========================================\n")
        raise HTTPException(status_code=500, detail=f"Erro ao processar a pergunta: {str(e)}")