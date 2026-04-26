from typing import TypedDict, List, Optional, Literal


class RAGState(TypedDict):
    # --- Entrée ---
    question: str                          # Question de l'utilisateur

    # --- Routeur ---
    question_type: Optional[Literal[
        "text", "table", "image", "mixed"
    ]]                                     # Classification de la question

    # --- Recherche ---
    retrieved_chunks: Optional[List[dict]] # Chunks retournés par ChromaDB
    retrieval_attempts: int                # Nb de tentatives (évite boucle infinie)

    # --- Grading ---
    relevant_chunks: Optional[List[dict]]  # Chunks validés comme pertinents
    is_relevant: Optional[bool]            # Au moins un chunk pertinent ?

    # --- Génération ---
    answer: Optional[str]                  # Réponse finale
    sources: Optional[List[dict]]          # Sources utilisées
    confidence: Optional[float]            # Score de confiance 0-1