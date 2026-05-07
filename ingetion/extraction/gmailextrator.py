import base64
import logging

def extract_gmail_message(gmail_service, msg_id):
    """
    Récupère et formate le contenu d'un mail.
    Retourne un dict compatible avec peipline.process_email()
    Format : {"markdown": "...", "metadata": {...}}
    """
    try:
        m = gmail_service.users().messages().get(userId='me', id=msg_id).execute()
        headers = m.get('payload', {}).get('headers', [])

        subject = next((x['value'] for x in headers if x['name'] == 'Subject'), 'Sans Sujet')
        sender  = next((x['value'] for x in headers if x['name'] == 'From'),    'N/A')
        date    = next((x['value'] for x in headers if x['name'] == 'Date'),    'N/A')

        # ── Extraction du corps ────────────────────────────────────────────
        body = ""
        parts = m.get('payload', {}).get('parts', [m.get('payload', {})])
        for p in parts:
            if p.get('mimeType') == 'text/plain':
                data = p.get('body', {}).get('data')
                if data:
                    body += base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')

        # Repli sur le snippet Gmail si le corps est vide
        body = body.strip() or m.get('snippet', '')

        # ── Formatage Markdown (compatible process_email dans peipline.py) ─
        markdown = f"""# EMAIL : {subject}
**De :** {sender}
**Date :** {date}
**ID :** {msg_id}

---

{body}
"""

        # ── Métadonnées compatibles avec l'indexeur ────────────────────────
        metadata = {
    "source":       f"email_{msg_id}",
    "type":         "email",
    "content_type": "text",
    "subject":      str(subject or ""),
    "sender":       str(sender or ""),
    "message_id":   str(msg_id or ""),
    "date":         str(date or ""),
    "filename":     f"email_{msg_id}.txt",
}
        return {
            "markdown": markdown,
            "metadata": metadata,
        }

    except Exception as e:
        logging.error(f"Erreur extraction Gmail {msg_id}: {e}")
        return None