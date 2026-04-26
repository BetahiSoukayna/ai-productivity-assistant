from langgraph.graph import StateGraph, END
from loguru import logger

from .state import RAGState
from .nodes.router    import router_node
from .nodes.retriever import retriever_node
from .nodes.grader    import grader_node
from .nodes.generator import generator_node


def should_retry(state: dict) -> str:
    """
    Décision après le grading :
    - Si pertinent → générer la réponse
    - Si pas pertinent ET moins de 2 tentatives → retenter la recherche
    - Si pas pertinent ET 2 tentatives → générer quand même (avec avertissement)
    """
    is_relevant = state.get("is_relevant", False)
    attempts    = state.get("retrieval_attempts", 0)

    if is_relevant:
        logger.info("Décision → génération")
        return "generate"

    if attempts < 2:
        logger.info(f"Décision → retry (tentative {attempts})")
        return "retry"

    logger.warning("Décision → génération forcée (aucun chunk pertinent trouvé)")
    return "generate"


def build_graph() -> StateGraph:
    """
    Construit et compile le graphe LangGraph.
    """
    graph = StateGraph(RAGState)

    # Ajout des noeuds
    graph.add_node("router",    router_node)
    graph.add_node("retriever", retriever_node)
    graph.add_node("grader",    grader_node)
    graph.add_node("generator", generator_node)

    # Flux principal
    graph.set_entry_point("router")
    graph.add_edge("router",    "retriever")
    graph.add_edge("retriever", "grader")

    # Décision conditionnelle après grading
    graph.add_conditional_edges(
        "grader",
        should_retry,
        {
            "generate": "generator",
            "retry":    "retriever",   # Retour au retriever
        }
    )

    graph.add_edge("generator", END)

    return graph.compile()


# Instance globale — compilée une seule fois au démarrage
rag_graph = build_graph()


def ask(question: str, filters: dict = None) -> dict:
    """
    Point d'entrée principal du système RAG.
    Utilisé directement par l'API FastAPI.
    """
    logger.info(f"Question reçue : {question}")

    initial_state = {
        "question":           question,
        "question_type":      None,
        "retrieved_chunks":   None,
        "retrieval_attempts": 0,
        "relevant_chunks":    None,
        "is_relevant":        None,
        "answer":             None,
        "sources":            None,
        "confidence":         None,
    }

    final_state = rag_graph.invoke(initial_state)

    return {
        "answer":     final_state["answer"],
        "sources":    final_state["sources"],
        "confidence": final_state["confidence"],
        "type_detected": final_state["question_type"]
    }