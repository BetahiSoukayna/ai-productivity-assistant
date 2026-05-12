"""
Test Phase 1 — Pipeline d'ingestion.
Indexe un fichier texte de test dans ChromaDB Cloud.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

from phas1.peipline import process_file

print("\n=======================================================")
print(" TEST PHASE 1 — PIPELINE D'INGESTION")
print("=======================================================\n")

# Fichier de test
test_file = Path("data/document/test.txt")

if not test_file.exists():
    print(f"❌ Fichier de test introuvable : {test_file}")
    sys.exit(1)

print(f"📄 Fichier : {test_file}")
print(f"📏 Taille  : {test_file.stat().st_size} octets\n")

try:
    # Appel du pipeline avec metadata
    result = process_file(
        str(test_file),
        metadata={
            "source": "local_test",
            "filename": "test.txt",
            "user_id": "test_user"
        }
    )

    if result:
        print(f"\n✅ SUCCÈS — Pipeline Phase 1")
        print(f"   Fichier indexé : {test_file.name}")
        print(f"   Chunks créés   : {result.get('chunks_indexed', 'N/A')}")
        print(f"   Metadata       : {result.get('metadata', {})}")
    else:
        print("\n⚠️ Le pipeline a retourné None (contenu vide ou erreur d'extraction)")

except Exception as e:
    print(f"\n❌ ERREUR : {e}")
    import traceback
    traceback.print_exc()

print("\n=======================================================\n")
