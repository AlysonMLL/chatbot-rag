from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI(title="TabulaRAG API")

# Configurar CORS para permitir que o Vite (React) converse com o FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Ler o arquivo diretamente na memória (sem salvar no disco)
    contents = await file.read()
    
    try:
        # Identificar a extensão e usar o Pandas para ler
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            return {"error": "Formato de arquivo não suportado."}

        # Extrair Metadados
        # Converte os tipos complexos do pandas (int64, float64) para strings legíveis
        columns_info = [{"name": col, "type": str(dtype)} for col, dtype in df.dtypes.items()]
        
        # Pega as 4 primeiras linhas para a prévia (convertendo nulos para string vazia)
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