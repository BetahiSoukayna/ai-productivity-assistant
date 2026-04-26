import os
import base64
from openai import OpenAI # NVIDIA utilise le client OpenAI
from loguru import logger

def encode_image(image_path):
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode('utf-8')

def extract_text_from_image(image_path):
    """Analyse l'image avec NVIDIA NIM (Llama 3.2 Vision)."""
    
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        logger.error("❌ NVIDIA_API_KEY manquante dans le .env")
        return ""

    # NVIDIA NIM utilise l'URL de base spécifique à leur catalogue
    client = OpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=api_key
    )

    logger.info(f"🔍 Analyse NVIDIA Vision : {os.path.basename(image_path)}")

    try:
        base64_image = encode_image(image_path)
        
        response = client.chat.completions.create(
            model="meta/llama-3.2-11b-vision-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extrais tout le texte de cette image et décris les éléments au format Markdown."},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    ]
                }
            ],
            max_tokens=1024
        )

        content = response.choices[0].message.content
        logger.success(f"✅ Succès NVIDIA Vision pour {os.path.basename(image_path)}")
        return content

    except Exception as e:
        logger.error(f"💥 Erreur NVIDIA Vision : {e}")
        return ""