import os
import json
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from loguru import logger
from dotenv import load_dotenv

load_dotenv()

# Utilisation du mode JSON pour extraire des filtres structurés
llm_router = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0,
    api_key=os.getenv("GROQ_API_KEY"),
    model_kwargs={"response_format": {"type": "json_object"}}
)

ROUTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """Tu es le cerveau d'aiguillage d'un système RAG expert.
Ton rôle est d'analyser la question de l'utilisateur pour extraire les intentions de recherche.

Tu dois répondre avec un objet JSON structuré comme suit :
{{
    "type": "text" | "table" | "mixed",
    "target_file": "nom_du_fichier_si_mentionné" | null,
    "time_filter": "récent" | "ancien" | null,
    "search_query": "version optimisée de la question pour la recherche vectorielle"
}}

Règles :
- table : pour les stocks, prix, chiffres, inventaires.
- text : pour les procédures, emails, descriptions.
- mixed : si la question est large."""),
    ("human", "{question}")
])

router_chain = ROUTER_PROMPT | llm_router

def router_node(state: dict) -> dict:
    question = state["question"]
    logger.info(f"Routeur — Analyse de : {question[:50]}...")

    try:
        response = router_chain.invoke({"question": question})
        decision = json.loads(response.content)
        
        # Sécurité sur le type
        if decision.get("type") not in ["text", "table", "mixed"]:
            decision["type"] = "mixed"

        logger.info(f"Routeur → Type: {decision['type']}, Filtre Fichier: {decision['target_file']}")

    except Exception as e:
        logger.error(f"Erreur routage : {e}")
        decision = {"type": "mixed", "target_file": None, "time_filter": None, "search_query": question}

    # Mise à jour du state avec les nouveaux champs de métadonnées
    return {
        **state,
        "question_type": decision["type"],
        "target_file": decision.get("target_file"),
        "retrieval_attempts": 0
    }