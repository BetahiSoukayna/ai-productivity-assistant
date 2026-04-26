import os
import hashlib
import base64
import requests
from typing import List
from pathlib import Path
from loguru import logger
from dotenv import load_dotenv

# ChromaDB
import chromadb
from chromadb.utils import embedding_functions


load_dotenv()

# ─── Config ───────────────────────────────────────────────────────────────────
CHROMA_HOST       = os.getenv("CHROMA_HOST")
CHROMA_API_KEY    = os.getenv("CHROMA_API_KEY")
CHROMA_TENANT     = os.getenv("CHROMA_TENANT")
CHROMA_DATABASE   = os.getenv("CHROMA_DATABASE")
COLLECTION_NAME   = os.getenv("CHROMA_COLLECTION", "assistant_knowledge")
JINA_API_KEY      = os.getenv("JINA_API_KEY")

# Extensions d'images supportées
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}

# Mapping extension → MIME type pour l'API Jina
MIME_TYPES = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".png": "image/png",  ".gif": "image/gif",
    ".webp": "image/webp", ".bmp": "image/bmp",
}


class JinaIndexer:
    def __init__(self):
        # ── ChromaDB Cloud ────────────────────────────────────────────────────
        self.client = chromadb.HttpClient(
            ssl=True,
            host=CHROMA_HOST,
            headers={"x-chroma-token": CHROMA_API_KEY},
            tenant=CHROMA_TENANT,
            database=CHROMA_DATABASE,
        )

        # ── Embedding function (texte uniquement — Chroma l'appelle auto) ─────
        self.embedding_fn = embedding_functions.JinaEmbeddingFunction(
            api_key=JINA_API_KEY,
            model_name="jina-embeddings-v3",
        )

        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            f"Connecté à ChromaDB Cloud. "
            f"Collection '{COLLECTION_NAME}' — {self.collection.count()} chunks."
        )

    # ─── ID stable ────────────────────────────────────────────────────────────
    def generate_unique_id(self, text: str, metadata: dict) -> str:
        if "message_id" in metadata:
            raw = f"email_{metadata['message_id']}_{metadata.get('chunk_index', 0)}"
        elif "drive_id" in metadata:
            raw = f"drive_{metadata['drive_id']}_{metadata.get('chunk_index', 0)}"
        else:
            raw = f"file_{metadata['source']}_{metadata.get('chunk_index', 0)}_{text[:30]}"
        return hashlib.md5(raw.encode()).hexdigest()

    # ─── Indexation texte ─────────────────────────────────────────────────────
    def index_chunks(self, chunks: List[dict]) -> int:
        """
        Indexe un lot de chunks texte avec déduplication.
        Format : {"text": "...", "metadata": {...}}
        """
        if not chunks:
            return 0

        potential_ids  = [self.generate_unique_id(c["text"], c["metadata"]) for c in chunks]
        existing       = self.collection.get(ids=potential_ids)
        existing_ids   = set(existing["ids"])

        docs, metas, ids = [], [], []
        for i, chunk in enumerate(chunks):
            if potential_ids[i] not in existing_ids:
                docs.append(chunk["text"])
                metas.append(chunk["metadata"])
                ids.append(potential_ids[i])

        if docs:
            self.collection.add(documents=docs, metadatas=metas, ids=ids)
            logger.success(f"✓ {len(docs)} nouveaux chunks indexés.")
        else:
            logger.info("Tout est déjà indexé — aucun ajout.")

        return len(docs)

    # ─── Embedding image via Jina (vrai multimodal) ───────────────────────────
    def _get_image_embedding(self, image_path: str) -> list[float]:
        """
        Appelle l'API Jina directement avec l'image en base64.
        Retourne un vecteur de 1024 dimensions.
        """
        ext       = Path(image_path).suffix.lower()
        mime_type = MIME_TYPES.get(ext, "image/jpeg")

        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")

        payload = {
            "model": "jina-embeddings-v3",
            "input": [
                {
                    "image": f"data:{mime_type};base64,{b64}"
                }
            ],
        }

        response = requests.post(
            "https://api.jina.ai/v1/embeddings",
            headers={
                "Authorization": f"Bearer {JINA_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()["data"][0]["embedding"]

    # ─── Description image via LLM (vision) ───────────────────────────────────
    def _describe_image(self, image_path: str) -> str:
        """
        Envoie l'image à Claude claude-sonnet-4-20250514 (vision) pour obtenir
        une description textuelle riche. C'est cette description que le LLM
        lira dans le contexte RAG pour 'comprendre' l'image.
        """
        import anthropic

        ext       = Path(image_path).suffix.lower()
        mime_type = MIME_TYPES.get(ext, "image/jpeg")

        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")

        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": mime_type,
                                "data": b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": (
                                "Décris cette image de façon précise et exhaustive. "
                                "Inclus : le contenu principal, les textes visibles, "
                                "les données chiffrées (tableaux, graphiques), "
                                "les couleurs importantes et tout élément utile "
                                "pour répondre à des questions sur cette image. "
                                "Réponds en français."
                            ),
                        },
                    ],
                }
            ],
        )
        return message.content[0].text

    # ─── Indexation image (multimodal + description LLM) ─────────────────────
    def index_image(self, image_path: str, metadata: dict) -> bool:
        """
        Indexation complète d'une image :
        1. Génère un vrai embedding visuel via Jina (recherche image ↔ texte)
        2. Génère une description textuelle via Claude Vision (compréhension LLM)
        3. Stocke les deux dans ChromaDB

        Le LLM recevra la description dans le contexte RAG et pourra
        répondre à des questions sur le contenu de l'image.
        """
        img_id = hashlib.md5(f"img_{image_path}".encode()).hexdigest()

        # Déduplication
        existing = self.collection.get(ids=[img_id])
        if existing["ids"]:
            logger.debug(f"Image déjà indexée : {image_path}")
            return False

        logger.info(f"Analyse de l'image : {Path(image_path).name} ...")

        # 1. Embedding visuel réel (Jina multimodal)
        try:
            embedding = self._get_image_embedding(image_path)
        except Exception as e:
            logger.error(f"Erreur embedding image : {e}")
            return False

        # 2. Description textuelle via Claude Vision
        try:
            description = self._describe_image(image_path)
            logger.info(f"Description générée ({len(description)} chars)")
        except Exception as e:
            logger.warning(f"Erreur description image : {e} — description basique utilisée")
            description = f"[IMAGE] {Path(image_path).name}"

        # 3. Stockage dans ChromaDB
        # - document = description textuelle (lu par le LLM dans le contexte RAG)
        # - embedding = vecteur visuel Jina (utilisé pour la recherche sémantique)
        self.collection.add(
            ids=[img_id],
            embeddings=[embedding],
            documents=[description],
            metadatas=[{
                **metadata,
                "type":        "image",
                "path":        image_path,
                "filename":    Path(image_path).name,
                "has_vision":  True,
            }],
        )

        logger.success(f"✓ Image indexée avec description : {Path(image_path).name}")
        return True

_indexer_instance = None

def get_indexer() -> JinaIndexer:
    global _indexer_instance
    if _indexer_instance is None:
        _indexer_instance = JinaIndexer()
    return _indexer_instance

def index_chunks(chunks: List[dict]) -> int:
    return get_indexer().index_chunks(chunks)

def index_image(image_path: str, metadata: dict) -> bool:
    return get_indexer().index_image(image_path, metadata)

# Ajoutez ceci à la fin de phas1/indexer.py

def get_collection():
    """
    Retourne l'objet collection ChromaDB pour faire des requêtes.
    S'adapte à votre instance d'Indexer.
    """
    indexer = get_indexer() # Utilise votre fonction existante
    return indexer.collection

def get_embedding_fn():
    """
    Retourne l'instance de JinaEmbeddings utilisée lors de l'indexation.
    """
    indexer = get_indexer()
    return indexer.embedding_fn