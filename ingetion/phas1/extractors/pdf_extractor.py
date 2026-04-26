import fitz
from pathlib import Path
from loguru import logger

def extract_pdf(file_path: str) -> dict:
    path = Path(file_path)
    doc = fitz.open(file_path)
    pages_content = []
    embedded_images = []

    img_dir = Path("./data/extracted_images") / path.stem
    img_dir.mkdir(parents=True, exist_ok=True)

    for page_num, page in enumerate(doc, start=1):
        # On récupère les images d'abord pour savoir où les placer
        image_list = page.get_images(full=True)
        page_images_map = {}
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            img_filename = f"page{page_num}_img{img_index}.{base_image['ext']}"
            img_path = img_dir / img_filename
            
            with open(img_path, "wb") as f:
                f.write(base_image["image"])
            
            # Stockage pour indexation séparée
            img_data = {
                "path": str(img_path),
                "metadata": {"source": str(path.name), "page": page_num, "content_type": "image"}
            }
            embedded_images.append(img_data)
            page_images_map[img_index] = img_filename

        # Construction du Markdown
        page_md = f"\n\n## Page {page_num}\n\n"
        blocks = page.get_text("blocks")
        for block in blocks:
            block_text = block[4].strip()
            if not block_text: continue
            
            # Détection de titre simple
            if len(block_text) < 80 and (block_text.isupper() or block_text.endswith(':')):
                page_md += f"### {block_text}\n\n"
            else:
                page_md += f"{block_text}\n\n"

        # Insertion des références d'images à la fin de la page (ou au milieu si possible)
        for img_name in page_images_map.values():
            page_md += f"\n![[Image: {img_name}]]\n"

        pages_content.append({"page": page_num, "content": page_md})

    doc.close()
    return {
        "markdown": "\n".join([p["content"] for p in pages_content]),
        "metadata": {"source": str(path), "filename": path.name, "file_type": "pdf"},
        "embedded_images": embedded_images
    }