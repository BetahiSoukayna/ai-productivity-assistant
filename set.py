"""
SETUP AUTOMATION SCRIPT
Corrige et installe tout automatiquement
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description=""):
    """Exécute une commande et affiche le résultat"""
    if description:
        print(f"\n📦 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} réussi")
            return True
        else:
            print(f"❌ Erreur : {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Erreur : {str(e)}")
        return False

def main():
    print("="*60)
    print("🚀 INSTALLATION AUTOMATIQUE - AI PRODUCTIVITY ASSISTANT")
    print("="*60)
    
    # 1. Vérifier Python
    print(f"\n✅ Python version : {sys.version.split()[0]}")
    
    # 2. Créer .env s'il n'existe pas
    if not os.path.exists(".env"):
        print("\n📝 Création du fichier .env...")
        with open(".env", "w") as f:
            f.write("# Ajoute ta clé API Gemini ici\n")
            f.write("GEMINI_API_KEY=AIza_YOUR_API_KEY_HERE\n")
        print("✅ Fichier .env créé (mets ta clé API !)")
    else:
        print("✅ Fichier .env existe déjà")
    
    # 3. Créer .gitignore s'il n'existe pas
    if not os.path.exists(".gitignore"):
        print("\n📝 Création du fichier .gitignore...")
        with open(".gitignore", "w") as f:
            f.write(".env\n")
            f.write("__pycache__/\n")
            f.write("*.pyc\n")
            f.write("venv/\n")
        print("✅ Fichier .gitignore créé")
    else:
        # Vérifier que .env est dans .gitignore
        with open(".gitignore", "r") as f:
            content = f.read()
            if ".env" not in content:
                print("⚠️  Ajout de .env à .gitignore...")
                with open(".gitignore", "a") as f:
                    f.write(".env\n")
                print("✅ .env ajouté à .gitignore")
    
    # 4. Mettre à jour pip
    print("\n📦 Mise à jour de pip...")
    run_command(
        f"{sys.executable} -m pip install --upgrade pip",
        "Mise à jour pip"
    )
    
    # 5. Installer les packages (VERSION CORRECTE)
    print("\n📦 Installation des dépendances...")
    packages = [
        "google-generativeai",
        "python-dotenv",
        "langchain",
        "langchain-google-genai",
    ]
    
    for package in packages:
        cmd = f"{sys.executable} -m pip install {package}"
        run_command(cmd, f"Installation {package}")
    
    # 6. Vérifier les imports
    print("\n🔍 Vérification des imports...")
    try:
        import google.generativeai
        print("✅ google.generativeai importé")
    except ImportError:
        print("❌ Erreur : google.generativeai non disponible")
        return False
    
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        print("✅ langchain_google_genai importé")
    except ImportError:
        print("❌ Erreur : langchain_google_genai non disponible")
        return False
    
    try:
        from dotenv import load_dotenv
        print("✅ python-dotenv importé")
    except ImportError:
        print("❌ Erreur : python-dotenv non disponible")
        return False
    
    # 7. Créer requirements.txt
    print("\n📝 Création de requirements.txt...")
    requirements = """google-generativeai>=0.8.0
python-dotenv>=1.0.0
langchain>=1.2.0
langchain-google-genai>=0.1.0
"""
    with open("requirements.txt", "w") as f:
        f.write(requirements)
    print("✅ requirements.txt créé")
    
    # 8. Summary
    print("\n" + "="*60)
    print("✅ INSTALLATION COMPLÈTE !")
    print("="*60)
    print("""
Prochaines étapes :

1️⃣  Ajoute ta clé API au fichier .env :
    GEMINI_API_KEY=AIza_YOUR_API_KEY_HERE
    
2️⃣  Obtiens ta clé API gratuitement sur :
    https://aistudio.google.com/app/apikey
    
3️⃣  Lance le test 1 :
    python test_1_simple_request.py
    
4️⃣  Lance les autres tests dans l'ordre.

💡 Besoin d'aide ? Consulte EXECUTION_GUIDE.md
""")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)