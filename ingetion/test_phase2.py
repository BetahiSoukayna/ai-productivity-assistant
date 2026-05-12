"""
Test Phase 2 — Agent RAG LangGraph.
Pose une question et vérifie que le graphe retourne une réponse avec sources.
"""
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

from phas2.graph import ask

print("\n=======================================================")
print(" TEST PHASE 2 — AGENT RAG (LangGraph)")
print("=======================================================\n")

question = "Quel est l'objectif du projet AI Productivity Assistant ?"
print(f"❓ Question : {question}\n")
print("🤖 Réflexion en cours...\n")

try:
    result = ask(question)

    print("=" * 50)
    print("📝 RÉPONSE :")
    print("=" * 50)
    print(result.get("answer", "Aucune réponse"))

    print("\n" + "-" * 50)
    print("📚 SOURCES :")
    sources = result.get("sources", [])
    if sources:
        for s in sources:
            print(f"  - {s.get('file', 'N/A')} (type: {s.get('type', 'N/A')}, score: {s.get('score', 0):.0%})")
    else:
        print("  Aucune source trouvée")

    print(f"\n🎯 Confiance : {result.get('confidence', 0):.0%}")
    print(f"📋 Type détecté : {result.get('type_detected', 'N/A')}")

    print("\n=======================================================")
    print(" ✅ TEST PHASE 2 RÉUSSI")
    print("=======================================================\n")

except Exception as e:
    print(f"\n❌ ERREUR : {e}")
    import traceback
    traceback.print_exc()
    print("\n=======================================================\n")
