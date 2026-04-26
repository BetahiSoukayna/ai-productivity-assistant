import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from phas1.indexer import get_collection, get_embedding_fn
from loguru import logger

llm_rewriter = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.2,
    api_key=os.getenv("GROQ_API_KEY")
)

def retriever_node(state: dict) -> dict:
    question = state["question"]
    question_type = state.get("question_type", "mixed")
    attempts = state.get("retrieval_attempts", 0)

    logger.info(f"Retriever — Mode Multi-Query (Tentative {attempts+1})")

    collection = get_collection()
    embedding_fn = get_embedding_fn()

    # 1. Génération de variations (Correction de l'input dict)
    try:
        # On passe directement la string formatée au lieu d'un dict
        res = llm_rewriter.invoke(f"Génère 3 variations de cette question : {question}")
        queries = [question] + res.content.strip().split("\n")
        queries = [q.strip() for q in queries if q.strip()][:4]
    except Exception as e:
        logger.error(f"Erreur rewrite : {e}")
        queries = [question]

    all_chunks = {}
    n_results = 5 if attempts == 0 else 10

    for q in queries:
        try:
            # 2. Correction : Utilisation de __call__ pour JinaEmbeddingFunction
            # ChromaDB's JinaEmbeddingFunction s'utilise en appelant l'objet directement
            query_embedding = embedding_fn([q])[0]
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )

            if results["documents"]:
                for i in range(len(results["documents"][0])):
                    doc_id = results["ids"][0][i]
                    score = round(1 - results["distances"][0][i], 3)
                    
                    if doc_id not in all_chunks or score > all_chunks[doc_id]["score"]:
                        all_chunks[doc_id] = {
                            "text": results["documents"][0][i],
                            "metadata": results["metadatas"][0][i],
                            "score": score
                        }
        except Exception as e:
            logger.error(f"Erreur sur la sous-requête '{q}': {e}")

    final_chunks = sorted(all_chunks.values(), key=lambda x: x["score"], reverse=True)
    final_chunks = final_chunks[:10]

    logger.success(f"Retriever → {len(final_chunks)} chunks récupérés")

    return {
        **state,
        "retrieved_chunks": final_chunks,
        "retrieval_attempts": attempts + 1
    }