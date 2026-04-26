import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from loguru import logger

# Utilisation du mode JSON pour une structure garantie
llm_grader = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY"),
    model_kwargs={"response_format": {"type": "json_object"}}
)

GRADER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Tu es un expert en évaluation de données. Ta tâche est d'analyser une liste de "chunks" (extraits de documents) et de déterminer s'ils sont pertinents pour répondre à la question de l'utilisateur.

Instructions :
1. Analyse chaque chunk individuellement par rapport à la question.
2. Pour chaque chunk, réponds par "yes" (pertinent) ou "no" (non pertinent).
3. Tu DOIS retourner un objet JSON au format suivant :
{{
    "evaluations": [
        {{"id": 0, "relevant": "yes"}},
        {{"id": 1, "relevant": "no"}}
    ]
}}"""),
    ("human", """QUESTION : {question}

CHUNKS À ÉVALUER :
{chunks_list}""")
])

grader_chain = GRADER_PROMPT | llm_grader

def grader_node(state: dict) -> dict:
    question = state["question"]
    chunks = state.get("retrieved_chunks", [])

    if not chunks:
        return {**state, "relevant_chunks": [], "is_relevant": False}

    # Filtrage préliminaire par score de similarité (optionnel mais recommandé)
    candidates = [c for c in chunks if c["score"] >= 0.35]
    
    if not candidates:
        logger.warning("Aucun chunk n'a un score de similarité suffisant.")
        return {**state, "relevant_chunks": [], "is_relevant": False}

    # Préparation du texte pour le batching
    chunks_text = ""
    for i, chunk in enumerate(candidates):
        chunks_text += f"---\nID: {i}\nContenu: {chunk['text'][:1000]}\n"

    logger.info(f"Grader — Évaluation par batch de {len(candidates)} chunks...")

    relevant_chunks = []
    try:
        response = grader_chain.invoke({
            "question": question,
            "chunks_list": chunks_text
        })
        
        # Parsing du JSON retourné par Groq
        results = json.loads(response.content)
        evals = results.get("evaluations", [])

        for eval_item in evals:
            idx = eval_item.get("id")
            is_yes = eval_item.get("relevant") == "yes"
            
            if is_yes and idx < len(candidates):
                relevant_chunks.append(candidates[idx])

        logger.info(f"Grader → {len(relevant_chunks)} chunks validés sur {len(candidates)}")

    except Exception as e:
        logger.error(f"Erreur lors du grading en batch : {e}")
        # Stratégie de repli : on garde les chunks avec le meilleur score
        relevant_chunks = [c for c in candidates if c["score"] > 0.55]

    return {
        **state,
        "relevant_chunks": relevant_chunks,
        "is_relevant": len(relevant_chunks) > 0
    }