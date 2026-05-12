import re
from pathlib import Path
from loguru import logger

# Import des extracteurs existants
from phas1.extractors import pdf_extractor,table_extractor,text_extractor
from phas1.extractors.email_extractor import extract_email
from phas1.extractors.image import extract_text_from_image

# Import des utilitaires de traitement
from phas1.chunker import create_chunks
from .indexer import index_chunks


def extract_txt(file_path: str) -> dict:
    """Extracteur simple pour les fichiers texte brut (.txt)."""
    path = Path(file_path)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    return {
        "markdown": f"# {path.stem}\n\n{content}",
        "metadata": {"source": str(path), "file_type": "txt"}
    }

# Mapping des extensions vers les fonctions d'extraction
EXTRACTORS = {
    # Documents textuels et techniques
    ".pdf": pdf_extractor.extract_pdf,
    ".docx": text_extractor.extract_docx,
    ".txt": extract_txt,
    
    # Données structurées
    ".xlsx": table_extractor.extract_excel,
    ".xls": table_extractor.extract_excel,
    ".csv": table_extractor.extract_excel,
    
    # Images (Vision OCR)
    ".jpg": extract_text_from_image,
    ".jpeg": extract_text_from_image,
    ".png": extract_text_from_image,
    ".webp": extract_text_from_image
}

def process_file(file_path: str, metadata: dict = None) -> dict:
    """
    Orchestrateur principal : 
    Extraction -> Nettoyage -> Chunking -> Indexation Cloud
    """
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext not in EXTRACTORS:
        logger.warning(f"⚠️ Format non supporté ignoré : {ext} ({path.name})")
        return None

    logger.info(f"🚀 Traitement en cours : {path.name}")

    try:
        # 1. PHASE D'EXTRACTION
        raw_result = EXTRACTORS[ext](file_path)
        
        # --- SÉCURITÉ ANTI-VIDE (Fix pour Groq 400) ---
        if not raw_result or "Erreur" in str(raw_result)[:20]:
            logger.error(f"❌ Abandon de l'indexation pour {path.name} : L'extracteur a échoué.")
            return None

        # 2. NORMALISATION DU RÉSULTAT ET DES MÉTADONNÉES
        if isinstance(raw_result, str):
            # Cas des images (renvoient souvent juste une chaîne de texte)
            markdown_content = raw_result
            file_metadata = {
                "filename": path.name,
                "source": path.name, # FIX : Force la présence de 'source'
                "extension": ext,
                "content_type": "image"
            }
        else:
            # Cas des PDF/Excel/Docx (renvoient un dictionnaire)
            markdown_content = raw_result.get("markdown", "")
            file_metadata = raw_result.get("metadata", {})
            
            # Garantir que les clés essentielles sont là pour l'indexeur
            file_metadata["filename"] = path.name
            if "source" not in file_metadata:
                file_metadata["source"] = path.name
            
            if "content_type" not in file_metadata:
                file_metadata["content_type"] = "table" if ext in ['.xlsx', '.csv'] else "text"

        # Fusionner les metadata passées en paramètre (ex: user_id, source API)
        if metadata:
            file_metadata.update(metadata)

        # 3. NETTOYAGE DU CONTENU
        markdown_content = clean_markdown(markdown_content)

        if not markdown_content or len(markdown_content.strip()) < 5:
            logger.warning(f"⚠️ Contenu trop pauvre ou vide pour {path.name}. On ignore.")
            return None

        # Aperçu pour le debug
        print(f"\n--- APERÇU DU CONTENU EXTRAIT ({ext}) ---")
        print(markdown_content[:500] + ("..." if len(markdown_content) > 500 else ""))
        print("--- FIN DE L'APERÇU ---\n")

        # 4. CHUNKING (Découpage en morceaux)
        chunks = create_chunks(markdown_content, file_metadata)
        
        # 5. INDEXATION (Envoi au Cloud ChromaDB)
        # On s'assure que chaque chunk a bien ses métadonnées avec 'source'
        chunks_to_send = []
        for c in chunks:
            # Sécurité ultime pour éviter l'erreur 'source' au niveau de l'indexeur
            c.metadata["source"] = c.metadata.get("source", path.name)
            chunks_to_send.append({"text": c.page_content, "metadata": c.metadata})
    
        if not chunks_to_send:
            logger.warning(f"⚠️ Aucun chunk généré pour {path.name}")
            return None

        logger.info(f"📡 Envoi de {len(chunks_to_send)} chunks vers ChromaDB Cloud...")
        indexed_count = index_chunks(chunks_to_send)

        return {
            "markdown": markdown_content,
            "metadata": file_metadata,
            "chunks_indexed": indexed_count,
            "filename": path.name,
            "status": "success"
        }

    except Exception as e:
        logger.error(f"💥 Erreur critique lors du traitement de {path.name} : {e}")
        return None

def clean_markdown(text: str) -> str:
    """Nettoie le texte extrait pour optimiser l'indexation RAG."""
    if not text:
        return ""
    
    # Remplacer les caractères spéciaux de puces
    text = text.replace("", "-").replace("•", "-")
    
    # Normalisation des espaces
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Limitation des sauts de ligne consécutifs
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

def process_email(raw_gmail_data):
    """Point d'entrée spécifique pour les données provenant de l'API Gmail."""
    try:
        result = extract_email(raw_gmail_data)
        
        # Ajout de la source si absente
        metadata = result["metadata"]
        if "source" not in metadata:
            metadata["source"] = f"email_{metadata.get('id', 'unknown')}"
            
        chunks = create_chunks(result["markdown"], metadata)
        
        chunks_to_send = [
            {"text": c.page_content, "metadata": c.metadata} 
            for c in chunks
        ]
        
        index_chunks(chunks_to_send)
        logger.success(f"📧 Email indexé : {metadata.get('subject')}")
    except Exception as e:
        logger.error(f"❌ Erreur traitement email : {e}")