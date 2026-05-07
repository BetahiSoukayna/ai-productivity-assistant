import io
import logging
from googleapiclient.http import MediaIoBaseDownload

# MIME types Google Docs → export texte
GDOCS_EXPORT_MIME = {
    "application/vnd.google-apps.document":     "text/plain",
    "application/vnd.google-apps.spreadsheet":  "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}

def extract_drive_file(drive_service, file_id):
    """
    Récupère le contenu d'un fichier Drive.
    Retourne un dict compatible avec peipline.process_file() via process_drive_content()
    Format : {"markdown": "...", "metadata": {...}}
    """
    try:
        f_meta = drive_service.files().get(
            fileId=file_id,
            fields="name, mimeType, modifiedTime, owners"
        ).execute()

        name      = f_meta.get('name', file_id)
        mime_type = f_meta.get('mimeType', '')
        modified  = f_meta.get('modifiedTime', '')
        owner     = (f_meta.get('owners') or [{}])[0].get('displayName', 'N/A')

        # ── Téléchargement / Export ────────────────────────────────────────
        export_mime = GDOCS_EXPORT_MIME.get(mime_type)

        if export_mime:
            # Fichier natif Google (Docs, Sheets, Slides) → export texte
            req = drive_service.files().export_media(
                fileId=file_id, mimeType=export_mime
            )
        else:
            # Fichier binaire (PDF, image, docx…) → téléchargement brut
            req = drive_service.files().get_media(fileId=file_id)

        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, req)
        done = False
        while not done:
            _, done = downloader.next_chunk()

        content = fh.getvalue().decode('utf-8', errors='ignore').strip()

        if not content:
            logging.warning(f"Contenu vide pour le fichier Drive {file_id} ({name})")
            return None

        # ── Formatage Markdown ─────────────────────────────────────────────
        markdown = f"""# DOCUMENT DRIVE : {name}
**Propriétaire :** {owner}
**Dernière modification :** {modified}
**ID Drive :** {file_id}

---

{content}
"""

        # ── Métadonnées compatibles avec l'indexeur ────────────────────────
        metadata = {
            "source":       f"drive_{file_id}",
            "type":         "drive",
            "content_type": "text",
            "filename":     name,
            "drive_id":     file_id,
            "mime_type":    mime_type,
            "modified":     modified,
            "owner":        owner,
        }

        return {
            "markdown": markdown,
            "metadata": metadata,
        }

    except Exception as e:
        logging.error(f"Erreur extraction Drive {file_id}: {e}")
        return None