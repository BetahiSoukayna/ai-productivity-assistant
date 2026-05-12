from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import base64

from services.google_auth_service import get_gmail_service
from extraction.gmailextrator import extract_gmail_message
from services.memory_service import add_gmail_to_memory
from services.email_ai_service import (
    summarize_email,
    detect_email_importance,
    suggest_email_reply,
)

router = APIRouter(prefix="/gmail", tags=["Gmail"])


class AddToMemoryRequest(BaseModel):
    user_id: str = "test_user"


def _get_header(headers, name, default=""):
    return next(
        (h.get("value", "") for h in headers if h.get("name", "").lower() == name.lower()),
        default
    )


def _extract_body_from_payload(payload):
    """
    Extraction simple du corps texte/html.
    On évite stockage local.
    """
    body = ""

    def walk(part):
        nonlocal body

        mime_type = part.get("mimeType", "")
        data = part.get("body", {}).get("data")

        if data and mime_type in ["text/plain", "text/html"]:
            try:
                decoded = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                body += "\n" + decoded
            except Exception:
                pass

        for child in part.get("parts", []) or []:
            walk(child)

    walk(payload)
    return body.strip()


@router.get("/emails")
def list_emails(max_results: int = 20, query: Optional[str] = None):
    """
    Affiche les derniers emails Gmail dans l'application.
    Ne stocke rien dans ChromaDB.
    """
    try:
        gmail = get_gmail_service()

        params = {
            "userId": "me",
            "maxResults": max_results,
        }

        if query:
            params["q"] = query

        result = gmail.users().messages().list(**params).execute()
        messages = result.get("messages", [])

        emails = []

        for msg in messages:
            detail = gmail.users().messages().get(
                userId="me",
                id=msg["id"],
                format="metadata",
                metadataHeaders=["Subject", "From", "Date"]
            ).execute()

            headers = detail.get("payload", {}).get("headers", [])

            emails.append({
                "id": msg["id"],
                "thread_id": detail.get("threadId"),
                "subject": _get_header(headers, "Subject", "Sans sujet"),
                "sender": _get_header(headers, "From", "N/A"),
                "date": _get_header(headers, "Date", "N/A"),
                "snippet": detail.get("snippet", ""),
            })

        return {
            "status": "success",
            "count": len(emails),
            "emails": emails,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/emails/{message_id}")
def get_email_detail(message_id: str):
    """
    Ouvre un email dans l'application.
    Ne stocke rien dans ChromaDB.
    """
    try:
        gmail = get_gmail_service()

        msg = gmail.users().messages().get(
            userId="me",
            id=message_id,
            format="full"
        ).execute()

        headers = msg.get("payload", {}).get("headers", [])
        payload = msg.get("payload", {})

        subject = _get_header(headers, "Subject", "Sans sujet")
        sender = _get_header(headers, "From", "N/A")
        date = _get_header(headers, "Date", "N/A")
        body = _extract_body_from_payload(payload) or msg.get("snippet", "")

        return {
            "status": "success",
            "email": {
                "id": message_id,
                "thread_id": msg.get("threadId"),
                "subject": subject,
                "sender": sender,
                "date": date,
                "snippet": msg.get("snippet", ""),
                "body": body,
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emails/{message_id}/summarize")
def summarize_gmail_email(message_id: str):
    """
    Résume l'email ouvert avec LLM direct.
    Pas besoin de ChromaDB ici.
    """
    try:
        gmail = get_gmail_service()
        result = extract_gmail_message(gmail, message_id)

        if not result:
            raise ValueError("Email introuvable ou impossible à extraire.")

        summary = summarize_email(result["markdown"])

        return {
            "status": "success",
            "message_id": message_id,
            **summary,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emails/{message_id}/importance")
def gmail_email_importance(message_id: str):
    """
    Détecte si l'email est important.
    """
    try:
        gmail = get_gmail_service()
        result = extract_gmail_message(gmail, message_id)

        if not result:
            raise ValueError("Email introuvable ou impossible à extraire.")

        importance = detect_email_importance(result["markdown"])

        return {
            "status": "success",
            "message_id": message_id,
            **importance,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emails/{message_id}/suggest-reply")
def gmail_suggest_reply(message_id: str):
    """
    Suggère une réponse à l'email.
    """
    try:
        gmail = get_gmail_service()
        result = extract_gmail_message(gmail, message_id)

        if not result:
            raise ValueError("Email introuvable ou impossible à extraire.")

        reply = suggest_email_reply(result["markdown"])

        return {
            "status": "success",
            "message_id": message_id,
            **reply,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emails/{message_id}/add-to-memory")
def gmail_add_to_memory(message_id: str, body: AddToMemoryRequest):
    """
    Ajoute l'email à ChromaDB seulement après validation utilisateur.
    """
    try:
        result = add_gmail_to_memory(
            message_id=message_id,
            user_id=body.user_id,
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))