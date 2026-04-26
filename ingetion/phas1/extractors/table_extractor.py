import pandas as pd
from pathlib import Path

def extract_excel(file_path: str) -> dict:
    path = Path(file_path)
    xl = pd.ExcelFile(file_path)
    all_md=[]
    all_markdown = f"# Document: {path.name}\n\n"
    
    for sheet_name in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet_name).fillna("")
        all_md.append(f"## Feuille: {sheet_name}\n\n" + df.to_markdown(index=False))
        
        return {
        "markdown": "\n\n".join(all_md),
        "metadata": {"source": str(file_path), "type": "excel"}
    }
    