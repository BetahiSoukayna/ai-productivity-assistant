import os
import time
from pathlib import Path
from loguru import logger
from dotenv import load_dotenv

# 1. CHARGEMENT PRIORITAIRE DU .ENV
load_dotenv() 

# 2. IMPORTS APRÈS CHARGEMENT DES CLÉS API
from phas1.peipline import process_file
from phas1.indexer import get_indexer
from phas2.graph import rag_graph

def run_interactive_system():
    print("\n" + "="*60)
    print(" ASSISTANT IA PRODUCTIVITÉ - MODE INTERACTIF (V2 + VISION)")
    print("="*60)

    # --- ÉTAPE 1 : INGESTION AUTOMATIQUE (Support Multi-format) ---
    data_dir = Path("data/document")
    # On a ajouté les extensions d'images ici
    extensions = ["*.xlsx", "*.pdf", "*.csv", "*.jpg", "*.jpeg", "*.png", "*.webp"]
    files = []
    for ext in extensions:
        files.extend(list(data_dir.glob(ext)))
    
    if files:
        logger.info(f"📁 Vérification de {len(files)} fichiers (Documents & Images)...")
        for f in files:
            process_file(f)
        logger.success("✅ Base de connaissances synchronisée.")
    else:
        logger.warning("⚠️ Aucun fichier trouvé dans /data/document.")

    # --- ÉTAPE 2 : BOUCLE DE CHAT ---
    print("\n" + "💬 Posez vos questions sur vos documents ou images (Tapez 'q' pour quitter)")
    print("-" * 60)

    session_id = f"user_session_{int(time.time())}"

    while True:
        user_input = input("\n❓ Vous : ").strip()

        if user_input.lower() in ['q', 'quit', 'exit']:
            print("\n👋 Au revoir !")
            break
        
        if not user_input:
            continue

        print("🤖 Réflexion...")
        try:
            config = {"configurable": {"thread_id": session_id}}
            inputs = {"question": user_input, "retrieval_attempts": 0}
            
            output = rag_graph.invoke(inputs, config=config)

            print("\n" + "─" * 40)
            print(output.get('answer', 'Désolé, je n\'ai pas pu générer de réponse.'))
            print("─" * 40)
            
            # Debug info
            conf = output.get('confidence', 0)
            sources = [s['file'] for s in output.get('sources', [])]
            logger.debug(f"🔍 Sources : {sources} | Score: {conf*100}%")

        except Exception as e:
            logger.error(f"❌ Erreur : {e}")
            print("Une erreur est survenue lors de la génération de la réponse.")

if __name__ == "__main__":
    run_interactive_system()