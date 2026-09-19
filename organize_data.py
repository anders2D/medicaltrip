#!/usr/bin/env python3
import os
import shutil
import zipfile
from pathlib import Path

BASE_DIR = Path("/Users/miyo123/projects/medicaltrip")
RAW_DIR = BASE_DIR / "MEDICAL_TRIP_COLOMBIA_SAS"
DATA_DIR = BASE_DIR / "data"

def fix_zip_filename(filename: str) -> str:
    """Fix CP437 encoding issues in zip files if present."""
    try:
        return filename.encode('cp437').decode('utf-8')
    except Exception:
        return filename

def organize():
    # 1. Create clean target directories
    passengers_dir = DATA_DIR / "chats" / "passengers" / "RVA271-5-GitersonZulaica"
    contacts_dir = DATA_DIR / "chats" / "contacts"
    liquidaciones_dir = DATA_DIR / "liquidaciones"

    for d in [passengers_dir, contacts_dir, liquidaciones_dir]:
        d.mkdir(parents=True, exist_ok=True)

    # 2. Extract and organize Passenger WhatsApp Chat
    passenger_zip = next(RAW_DIR.glob("**/*RVA271-5*.zip"), None)
    if passenger_zip and passenger_zip.exists():
        print(f"Extracting {passenger_zip.name}...")
        
        media_img = passengers_dir / "images"
        media_audio = passengers_dir / "audio"
        media_docs = passengers_dir / "documents"
        media_stickers = passengers_dir / "stickers"
        for d in [media_img, media_audio, media_docs, media_stickers]:
            d.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(passenger_zip, 'r') as zf:
            for member in zf.infolist():
                clean_name = fix_zip_filename(member.filename)
                target_file = clean_name
                
                data = zf.read(member.filename)
                ext = Path(clean_name).suffix.lower()

                if ext in ['.jpg', '.jpeg', '.png']:
                    out_path = media_img / Path(clean_name).name
                elif ext in ['.opus', '.mp3', '.ogg', '.m4a']:
                    out_path = media_audio / Path(clean_name).name
                elif ext in ['.pdf', '.vcf', '.docx', '.xlsx', '.csv']:
                    out_path = media_docs / Path(clean_name).name
                elif ext in ['.webp']:
                    out_path = media_stickers / Path(clean_name).name
                elif ext in ['.txt']:
                    out_path = passengers_dir / "chat_history.txt"
                else:
                    out_path = passengers_dir / Path(clean_name).name

                with open(out_path, 'wb') as f:
                    f.write(data)
        print(f"Extracted passenger chat to {passengers_dir}")

    # 3. Extract chat2.zip (contacts and group chats CSVs)
    chat2_zip = RAW_DIR / "chats" / "chat2.zip"
    if chat2_zip.exists():
        print(f"Extracting {chat2_zip.name}...")
        with zipfile.ZipFile(chat2_zip, 'r') as zf:
            for member in zf.infolist():
                clean_name = fix_zip_filename(member.filename)
                # Strip leading 'chat2/' if present
                rel_parts = Path(clean_name).parts
                if rel_parts and rel_parts[0] == "chat2":
                    rel_parts = rel_parts[1:]
                
                if not rel_parts:
                    continue
                
                out_path = contacts_dir / Path(*rel_parts)
                if member.is_dir():
                    out_path.mkdir(parents=True, exist_ok=True)
                else:
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    with open(out_path, 'wb') as f:
                        f.write(zf.read(member.filename))
        print(f"Extracted contacts chats to {contacts_dir}")

    # 4. Copy Excel liquidaciones with clean normalized names
    excel_files = list(RAW_DIR.glob("**/*.xlsx"))
    for ef in excel_files:
        clean_name = ef.name.strip()
        if "presencial" in clean_name.lower():
            target_name = "Liquidacion_acompanamiento_presencial.xlsx"
        elif "transporte" in clean_name.lower():
            target_name = "Liquidacion_transporte.xlsx"
        else:
            target_name = clean_name.replace(" ", "_")
        
        dest = liquidaciones_dir / target_name
        shutil.copy2(ef, dest)
        print(f"Copied {ef.name} -> {dest.name}")

    print("\n--- Summary of Organized Data ---")
    for root, dirs, files in os.walk(DATA_DIR):
        level = root.replace(str(DATA_DIR), '').count(os.sep)
        indent = ' ' * 4 * level
        folder = os.path.basename(root) or 'data'
        print(f"{indent}📁 {folder}/ ({len(files)} files)")

if __name__ == "__main__":
    organize()
