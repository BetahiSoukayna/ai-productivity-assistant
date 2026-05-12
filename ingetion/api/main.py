import os
from dotenv import load_dotenv
from api.routes_gmail import router as gmail_router

# Charger les variables d'environnement AVANT les imports qui en dépendent
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger
import tempfile, shutil
from phas1.peipline import process_file
from phas2.graph import ask

app = FastAPI(title="RAG API", version="1.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(gmail_router)

# ── Schémas ────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str
    user_id:  str = "default_user"
    filters:  dict = {}

class AskResponse(BaseModel):
    answer:        str
    sources:       list
    confidence:    float
    type_detected: str


# ── Endpoints ──────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ask", response_model=AskResponse)
def ask_question(req: AskRequest):
    """
    Endpoint utilisé par le frontend React.
    Reçoit une question, retourne une réponse avec sources.
    """
    if not req.question.strip():
        raise HTTPException(400, "La question ne peut pas être vide")

    try:
        result = ask(req.question, req.filters)
        return result
    except Exception as e:
        logger.error(f"Erreur /ask : {e}")
        raise HTTPException(500, str(e))


@app.post("/ingest")
async def ingest_file(
    file: UploadFile = File(...),
    source:   str = "unknown",
    filename: str = None,
    user_id:  str = "default_user",
    date:     str = None,
    sender:   str = None,
    subject:  str = None,
    drive_id: str = None,
):
    """
    Endpoint utilisé pour l'ingestion de fichiers.
    Reçoit un fichier, le traite et l'indexe dans ChromaDB.
    """
    # Sauvegarde temporaire
    suffix = os.path.splitext(file.filename)[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    metadata = {
        "source":   source,
        "filename": filename or file.filename,
        "user_id":  user_id,
        "date":     date     or "",
        "sender":   sender   or "",
        "subject":  subject  or "",
        "drive_id": drive_id or "",
    }

    try:
        result = process_file(tmp_path, metadata)
        indexed = result.get("chunks_indexed", 0) if result else 0
        return {"status": "success", "indexed": indexed}
    except Exception as e:
        logger.error(f"Erreur /ingest : {e}")
        raise HTTPException(500, str(e))
    finally:
        os.unlink(tmp_path)   # Supprime le fichier temporaire


# ── Lancement ──────────────────────────────────────────────
# uvicorn api.main:app --reload --port 8000