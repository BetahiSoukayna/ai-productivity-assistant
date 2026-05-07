from .gmailextrator import extract_gmail_message
from .driveextrator import extract_drive_file
from phas1.peipline import process_email, clean_markdown
from phas1.chunker import create_chunks
from phas1.indexer import index_chunks
from loguru import logger


class ExtratorManager:
    def __init__(self, gmail_service, drive_service):
        self.gmail = gmail_service
        self.drive = drive_service

    def get_data(self, source, doc_id):
        """
        Extrait les données brutes depuis Gmail ou Drive.
        Retourne le dict {"markdown": ..., "metadata": ...} normalisé.
        """
        if source == "gmail":
            return extract_gmail_message(self.gmail, doc_id)
        elif source == "drive":
            return extract_drive_file(self.drive, doc_id)
        return None

    def ingest(self, source, doc_id) -> bool:
        """
        Pipeline complet : Extraction → Nettoyage → Chunking → Indexation.
        Retourne True si l'indexation a réussi, False sinon.
        """
        logger.info(f"📥 Ingestion [{source}] : {doc_id}")

        # 1. Extraction
        result = self.get_data(source, doc_id)
        if not result:
            logger.error(f"❌ Extraction échouée pour [{source}] {doc_id}")
            return False

        markdown = result.get("markdown", "")
        metadata = result.get("metadata", {})

        # 2. Nettoyage
        markdown = clean_markdown(markdown)
        if not markdown or len(markdown.strip()) < 5:
            logger.warning(f"⚠️ Contenu trop pauvre pour [{source}] {doc_id}")
            return False

        # 3. Garantir les clés obligatoires pour l'indexeur
        metadata.setdefault("source",       f"{source}_{doc_id}")
        metadata.setdefault("filename",     f"{source}_{doc_id}.txt")
        metadata.setdefault("content_type", "text")

        # 4. Chunking
        chunks = create_chunks(markdown, metadata)
        if not chunks:
            logger.warning(f"⚠️ Aucun chunk généré pour [{source}] {doc_id}")
            return False

        # 5. Indexation
        chunks_to_send = [
            {"text": c.page_content, "metadata": c.metadata}
            for c in chunks
        ]
        index_chunks(chunks_to_send)
        logger.success(f"✅ [{source}] {doc_id} indexé ({len(chunks_to_send)} chunks)")
        return True

    def ingest_gmail(self, msg_id: str) -> bool:
        """Raccourci pour ingérer un email Gmail."""
        return self.ingest("gmail", msg_id)

    def ingest_drive(self, file_id: str) -> bool:
        """Raccourci pour ingérer un fichier Drive."""
        return self.ingest("drive", file_id)