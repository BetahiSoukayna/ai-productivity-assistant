"""
extraction_rag.py
=================
Connecteur Webhook Gmail + Drive → Pipeline RAG
"""

import os
import io
import json
import base64
import logging
import tempfile
import requests as http_requests
from pathlib import Path
from flask import Flask, request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from dotenv import load_dotenv

# ─────────────────────────────────────────────────────────────
# ENV
# ─────────────────────────────────────────────────────────────
load_dotenv()

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from phas1.chunker import create_chunks
from phas1.peipline import clean_markdown
from phas1.indexer import get_indexer
from extraction.gmailextrator import extract_gmail_message
from extraction.driveextrator import extract_drive_file

# ✅ UNIQUE INDEXER (IMPORTANT)
indexer = get_indexer()

# ─────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

# ─────────────────────────────────────────────────────────────
# FLASK
# ─────────────────────────────────────────────────────────────
app = Flask(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
]

TOKEN_FILE = "token.json"
CREDENTIALS_FILE = "credentials.json"

# ─────────────────────────────────────────────────────────────
# AUTH GOOGLE
# ─────────────────────────────────────────────────────────────
def get_service(name, version):
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                SCOPES
            )
            creds = flow.run_local_server(port=8080)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return build(name, version, credentials=creds, static_discovery=False)

# ─────────────────────────────────────────────────────────────
# INGESTION RAG CORE
# ─────────────────────────────────────────────────────────────
def ingest_to_rag(markdown: str, metadata: dict, label: str):
    print("\n==================== DEBUG ====================")
    print("LABEL:", label)
    print("MARKDOWN LEN:", len(markdown) if markdown else 0)

    markdown = clean_markdown(markdown)

    print("AFTER CLEAN LEN:", len(markdown) if markdown else 0)

    chunks = create_chunks(markdown, metadata)

    print("CHUNKS COUNT:", len(chunks))

    if not chunks:
        print("❌ NO CHUNKS → STOP")
        return False

    chunks_to_send = [
        {"text": c.page_content, "metadata": c.metadata}
        for c in chunks
    ]

    print("📦 Sending to ChromaDB...")

    # 🔥 IMPORTANT
    indexer.index_chunks(chunks_to_send)

    print("✅ Indexed successfully")
    return True
# ─────────────────────────────────────────────────────────────
# GMAIL
# ─────────────────────────────────────────────────────────────
def process_gmail(gmail_service, msg_id):
    try:
        result = extract_gmail_message(gmail_service, msg_id)

        markdown = result["markdown"]
        metadata = result["metadata"]

        ingest_to_rag(markdown, metadata, f"email_{msg_id}")

        return True

    except Exception as e:
        logging.error(f"Gmail error {msg_id}: {e}")
        return False

# ─────────────────────────────────────────────────────────────
# DRIVE
# ─────────────────────────────────────────────────────────────
def process_drive(drive_service, file_id):
    try:
        result = extract_drive_file(drive_service, file_id)

        ingest_to_rag(
            result["markdown"],
            result["metadata"],
            f"drive_{file_id}"
        )

        return True

    except Exception as e:
        logging.error(f"Drive error {file_id}: {e}")
        return False

# ─────────────────────────────────────────────────────────────
# WEBHOOK GMAIL
# ─────────────────────────────────────────────────────────────
@app.route("/gmail-webhook", methods=["POST"])
@app.route('/gmail-webhook', methods=['POST'])
def gmail_webhook():

    envelope = request.get_json(silent=True)
    if not envelope:
        return "OK", 200

    data = envelope.get('message', {}).get('data')
    if not data:
        return "OK", 200

    decoded = json.loads(base64.b64decode(data).decode('utf-8'))

    gmail = get_service('gmail', 'v1')

    # 🔥 FIX IMPORTANT : fallback si history vide
    try:
        history = gmail.users().history().list(
            userId='me',
            startHistoryId=decoded.get('historyId'),
            historyTypes=['messageAdded']
        ).execute()
    except Exception as e:
        logging.warning(f"History error fallback: {e}")
        history = {}

    found = False

    for h in history.get("history", []):
        for m in h.get("messagesAdded", []):
            found = True
            msg_id = m["message"]["id"]

            print("📬 EMAIL DETECTÉ:", msg_id)

            process_gmail(gmail, msg_id)

    # 🔥 FALLBACK IMPORTANT (TRÈS IMPORTANT)
    if not found:
        print("⚠️ History vide → fallback latest emails")

        messages = gmail.users().messages().list(
            userId="me",
            maxResults=5
        ).execute().get("messages", [])

        for m in messages:
            print("📬 FALLBACK EMAIL:", m["id"])
            process_gmail(gmail, m["id"])

    return "OK", 200

# ─────────────────────────────────────────────────────────────
# WEBHOOK DRIVE
# ─────────────────────────────────────────────────────────────
@app.route("/webhook-drive", methods=["POST"])
def drive_webhook():
    drive = get_service("drive", "v3")

    results = drive.changes().list(
        pageToken="startPageToken",
        spaces="drive"
    ).execute()

    for c in results.get("changes", []):
        if not c.get("removed"):
            process_drive(drive, c["fileId"])

    return "OK", 200

# ─────────────────────────────────────────────────────────────
# RUN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    logging.info("🚀 Gmail + Drive → RAG START")

    app.run(host="0.0.0.0", port=5000)