import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()


def _get_llm():
    return ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model_name=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        temperature=0.2,
    )


def summarize_email(markdown: str):
    llm = _get_llm()

    prompt = f"""
Tu es un assistant de productivité.
Résume l'email suivant en français de manière claire.

Format demandé :
- Sujet principal
- Points importants
- Action recommandée

EMAIL :
{markdown}
"""

    response = llm.invoke(prompt)

    return {
        "summary": response.content
    }


def detect_email_importance(markdown: str):
    llm = _get_llm()

    prompt = f"""
Analyse cet email et donne son importance.

Réponds en JSON strict :
{{
  "importance": "low|medium|high",
  "reason": "raison courte",
  "action_required": true ou false
}}

EMAIL :
{markdown}
"""

    response = llm.invoke(prompt)

    return {
        "result": response.content
    }


def suggest_email_reply(markdown: str):
    llm = _get_llm()

    prompt = f"""
Tu es un assistant professionnel.
Propose une réponse courte, polie et professionnelle à cet email.

EMAIL :
{markdown}
"""

    response = llm.invoke(prompt)

    return {
        "suggested_reply": response.content
    }