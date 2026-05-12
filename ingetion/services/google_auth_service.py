import os
from pathlib import Path

from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/tasks",
]

TOKEN_FILE = os.getenv("GOOGLE_TOKEN_FILE", str(BASE_DIR / "token.json"))
CREDENTIALS_FILE = os.getenv("GOOGLE_CREDENTIALS_FILE", str(BASE_DIR / "credentials.json"))


def get_google_service(name: str, version: str):
    """
    Crée un service Google API.
    Première exécution : ouvre le navigateur pour autoriser le compte Google.
    Ensuite : utilise token.json automatiquement.
    """
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_FILE):
                raise FileNotFoundError(
                    f"credentials.json introuvable : {CREDENTIALS_FILE}"
                )

            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_FILE,
                SCOPES
            )
            creds = flow.run_local_server(port=8080)

        with open(TOKEN_FILE, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

    return build(name, version, credentials=creds, static_discovery=False)


def get_gmail_service():
    return get_google_service("gmail", "v1")


def get_drive_service():
    return get_google_service("drive", "v3")


def get_calendar_service():
    return get_google_service("calendar", "v3")


def get_tasks_service():
    return get_google_service("tasks", "v1")