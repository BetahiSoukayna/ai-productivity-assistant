from phas1.indexer import get_indexer

print("\n=======================================================")
print(" TEST CHROMADB — VERIFICATION DE L'INDEXATION")
print("=======================================================\n")

indexer = get_indexer()
collection = indexer.collection

count = collection.count()

print(f"Total de chunks dans ChromaDB : {count}\n")

results = collection.get(
    include=["metadatas", "documents"]
)

metadatas = results.get("metadatas", [])

email_count = 0
drive_count = 0
local_count = 0

for meta_list in metadatas:
    if not meta_list:
        continue

    meta = meta_list

    source = str(meta.get("source", "")).lower()

    if "email_" in source:
        email_count += 1
    elif "drive_" in source:
        drive_count += 1
    else:
        local_count += 1

print("Répartition des sources :")
print(f"  EMAIL : {email_count}")
print(f"  DRIVE : {drive_count}")
print(f"  LOCAL : {local_count}")

print("\n=======================================================\n")