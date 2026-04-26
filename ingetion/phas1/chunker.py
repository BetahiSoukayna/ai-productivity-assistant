from langchain_text_splitters import RecursiveCharacterTextSplitter
from loguru import logger

def create_chunks(markdown_text: str, metadata: dict):
    # On configure le découpeur
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,       # Taille idéale pour garder du sens sans être trop long
        chunk_overlap=100,     # On fait chevaucher les morceaux pour ne pas perdre le contexte
        separators=["\n## ", "\n### ", "\n\n", ". ", "\n", " "] 
    )
    
    # Création des documents LangChain
    chunks = text_splitter.create_documents([markdown_text], metadatas=[metadata])
    
    logger.info(f"Découpage terminé : {len(chunks)} morceaux créés.")
    return chunks