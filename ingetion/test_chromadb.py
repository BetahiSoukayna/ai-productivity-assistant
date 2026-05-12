"""
Test de connexion à ChromaDB Cloud.
Vérifie que la base vectorielle est accessible et affiche les statistiques.
"""
import os
from dotenv import load_dotenv

# Charger les variables d'environnement AVANT tout import qui en dépend
load_dotenv()

from phas1.indexer import get_indexer

print("\n=======================================================")
print(" TEST CHROMADB — VERIFICATION DE LA CONNEXION")
print("=======================================================\n")

try:
    indexer = get_indexer()
    collection = indexer.collection

    # Afficher les infos de connexion (sans exposer les clés)
    print(f"✅ Connexion OK")
    print(f"   Host     : {os.getenv('CHROMA_HOST', 'N/A')}")
    print(f"   Database : {os.getenv('CHROMA_DATABASE', 'N/A')}")
    print(f"   Tenant   : {os.getenv('CHROMA_TENANT', 'N/A')[:8]}...")
    print(f"   Collection : {collection.name}")

    count = collection.count()
    print(f"\n📊 Total de chunks dans ChromaDB : {count}\n")

    if count > 0:
        results = collection.get(
            include=["metadatas"],
            limit=min(count, 100)
        )

        metadatas = results.get("metadatas", [])

        email_count = 0
        drive_count = 0
        local_count = 0

        for meta in metadatas:
            if not meta:
                continue
            source = str(meta.get("source", "")).lower()
            if "email_" in source:
                email_count += 1
            elif "drive_" in source:
                drive_count += 1
            else:
                local_count += 1

        print("Répartition des sources :")
        print(f"  📧 EMAIL : {email_count}")
        print(f"  📁 DRIVE : {drive_count}")
        print(f"  📄 LOCAL : {local_count}")

    print("\n=======================================================")
    print(" ✅ TEST RÉUSSI — ChromaDB Cloud est accessible")
    print("=======================================================\n")

except Exception as e:
    print(f"\n❌ ERREUR DE CONNEXION : {e}")
    print("\nVérifiez votre fichier .env avec les variables :")
    print("  CHROMA_HOST, CHROMA_API_KEY, CHROMA_TENANT, CHROMA_DATABASE")
    print("  JINA_API_KEY (pour les embeddings)")
    print("\n=======================================================\n")