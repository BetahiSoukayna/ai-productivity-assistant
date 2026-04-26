import hashlib
from datetime import datetime
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from loguru import logger

def extract_email(email_data: dict) -> dict:
    """
    Transforme un email brut en Markdown structuré.
    Attend un dictionnaire contenant : subject, from, to, date, body_html/text, message_id
    """
    try:
        subject = email_data.get("subject", "Sans objet")
        sender = email_data.get("from", "Inconnu")
        date_raw = email_data.get("date", "")
        message_id = email_data.get("message_id", hashlib.md5(subject.encode()).hexdigest())
        
        # 1. Conversion du corps (HTML -> Markdown)
        body_html = email_data.get("body_html", "")
        body_text = email_data.get("body_text", "")
        
        if body_html:
            # On nettoie le HTML avant conversion pour éviter le bruit
            soup = BeautifulSoup(body_html, "html.parser")
            # On retire les balises script et style
            for script in soup(["script", "style"]):
                script.decompose()
            clean_markdown = md(str(soup), heading_style="ATX")
        else:
            clean_markdown = body_text

        # 2. Construction du Markdown final (Le "Template" pour l'IA)
        structured_markdown = f"""# EMAIL : {subject}
**De :** {sender}
**Date :** {date_raw}
**ID :** {message_id}

---

{clean_markdown.strip()}
"""

        # 3. Préparation des métadonnées pour ChromaDB
        metadata = {
            "source": f"email_{message_id}",
            "type": "email",
            "subject": subject,
            "sender": sender,
            "message_id": message_id,
            "date": date_raw
        }

        return {
            "markdown": structured_markdown,
            "metadata": metadata
        }

    except Exception as e:
        logger.error(f"Erreur lors de l'extraction de l'email : {e}")
        return None