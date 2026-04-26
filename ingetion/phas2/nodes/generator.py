import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from loguru import logger

# 1. Mise à jour vers le dernier modèle stable llama-3.3
llm_generator = ChatGroq(
    model="llama-3.3-70b-versatile",   
    temperature=0.3,
    api_key=os.getenv("GROQ_API_KEY")
)

GENERATOR_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Tu es l'Assistant IA Productivité v2. Ton objectif est de fournir des réponses d'expert, claires et structurées.

DIRECTIVES DE RÉPONSE :
1. Analyse les documents fournis pour répondre à la question.
2. Si les données contiennent des chiffres, des inventaires ou des comparaisons, utilise EXCLUSIVEMENT des tableaux Markdown.
3. Utilise le gras pour mettre en évidence les informations cruciales.
4. Si l'information est manquante, indique-le avec professionnalisme.
5. Termine toujours par une brève analyse ou recommandation si pertinent.

TON : Professionnel, factuel et orienté action."""),
    ("human", """CONTEXTE DES DOCUMENTS :
{context}

QUESTION : {question}

Réponse structurée (en français) :""")
])

generator_chain = GENERATOR_PROMPT | llm_generator

def generator_node(state: dict) -> dict:
    question = state["question"]
    relevant_chunks = state.get("relevant_chunks", [])
    
    # --- FIX 1 : Initialisation précoce pour éviter l'erreur "referenced before assignment" ---
    source_links = []
    full_answer = ""
    avg_confidence = 0.0

    if not relevant_chunks:
        return {
            **state,
            "answer": "❌ **Information non trouvée.**\n\nAprès analyse, je n'ai trouvé aucun document pertinent.",
            "sources": [],
            "confidence": 0.0
        }

    # Préparation du contexte
    context_parts = []
    for i, chunk in enumerate(relevant_chunks, 1):
        filename = chunk["metadata"].get("filename", "Document sans nom")
        context_parts.append(f"--- SOURCE {i} ({filename}) ---\n{chunk['text']}")
    context = "\n\n".join(context_parts)

    try:
        # 2. Génération de la réponse
        response = generator_chain.invoke({
            "context": context,
            "question": question
        })
        answer = response.content

        # Construction des sources
        seen_files = set()
        for chunk in relevant_chunks:
            fname = chunk["metadata"].get("filename", "Inconnu")
            if fname not in seen_files:
                source_links.append({
                    "file": fname,
                    "type": chunk["metadata"].get("content_type", "N/A"),
                    "score": chunk["score"]
                })
                seen_files.add(fname)

        # Formatage final
        footer = "\n\n---\n### 📚 Sources consultées\n"
        for s in source_links:
            footer += f"- **{s['file']}** *(Type: {s['type']}, Confiance: {int(s['score']*100)}%)*\n"
        
        full_answer = answer + footer
        avg_confidence = round(sum(c["score"] for c in relevant_chunks) / len(relevant_chunks), 2)

        logger.success("Génération réussie.")

    except Exception as e:
        logger.error(f"Erreur génération : {e}")
        full_answer = f"Désolé, une erreur technique est survenue lors de la génération : {str(e)}"

    return {
        **state,
        "answer": full_answer,
        "sources": source_links,
        "confidence": avg_confidence
    }