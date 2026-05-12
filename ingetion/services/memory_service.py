from loguru import logger

from services.google_auth_service import get_gmail_service, get_drive_service
from extraction.gmailextrator import extract_gmail_message
from extraction.driveextrator import extract_drive_file

from phas1.peipline import clean_markdown
from phas1.chunker import create_chunks
from phas1.indexer import get_indexer


indexer = get_indexer()


def _index_markdown_to_chroma(markdown: str, metadata: dict):
    """
    Markdown + metadata → clean → chunks → ChromaDB.
    Aucun stockage local durable.
    """
    markdown = clean_markdown(markdown)

    if not markdown or len(markdown.strip()) < 5:
        raise ValueError("Contenu trop court pour être indexé.")

    chunks = create_chunks(markdown, metadata)

    if not chunks:
        raise ValueError("Aucun chunk généré.")

    chunks_to_send = [
        {
            "text": chunk.page_content,
            "metadata": chunk.metadata,
        }
        for chunk in chunks
    ]

    indexer.index_chunks(chunks_to_send)

    return {
        "indexed": len(chunks_to_send),
        "metadata": metadata,
    }


def add_gmail_to_memory(message_id: str, user_id: str = "test_user"):
    """
    Route appelée après clic utilisateur :
    "Ajouter cet email à la mémoire IA".
    """
    logger.info(f"Ajout Gmail à la mémoire IA : {message_id}")

    gmail = get_gmail_service()

    result = extract_gmail_message(gmail, message_id)
    if not result:
        raise ValueError("Impossible d'extraire cet email Gmail.")

    markdown = result["markdown"]
    metadata = result["metadata"]

    metadata["user_id"] = user_id
    metadata["source"] = "gmail"
    metadata["gmail_id"] = message_id
    metadata["memory_status"] = "user_confirmed"
    metadata["content_type"] = "email"

    indexed = _index_markdown_to_chroma(markdown, metadata)

    return {
        "status": "success",
        "source": "gmail",
        "message_id": message_id,
        "indexed": indexed["indexed"],
        "metadata": metadata,
    }


def add_drive_to_memory(file_id: str, user_id: str = "test_user"):
    """
    Route appelée après clic utilisateur :
    "Ajouter ce document Drive à la mémoire IA".
    """
    logger.info(f"Ajout Drive à la mémoire IA : {file_id}")

    drive = get_drive_service()

    result = extract_drive_file(drive, file_id)
    if not result:
        raise ValueError("Impossible d'extraire ce fichier Drive.")

    markdown = result["markdown"]
    metadata = result["metadata"]

    metadata["user_id"] = user_id
    metadata["source"] = "drive"
    metadata["drive_id"] = file_id
    metadata["memory_status"] = "user_confirmed"

    indexed = _index_markdown_to_chroma(markdown, metadata)

    return {
        "status": "success",
        "source": "drive",
        "file_id": file_id,
        "indexed": indexed["indexed"],
        "metadata": metadata,
    }