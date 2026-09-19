# Medical Trip Colombia - Data Workspace

This workspace contains all synchronized, uncompressed, and structured data from the **MEDICAL TRIP COLOMBIA S.A.S.** Google Drive repository.

---

## 📁 Directory Structure

```
medicaltrip/
├── data/
│   ├── chats/
│   │   ├── passengers/
│   │   │   └── RVA271-5-GitersonZulaica/
│   │   │       ├── chat_history.txt         # Full conversation log
│   │   │       ├── audio/                  # 68 Voice notes & audio files (.opus)
│   │   │       ├── documents/              # 28 PDFs (quotes, lab tests, check-mig, vCards)
│   │   │       ├── images/                 # 77 Photos, receipts & scans (.jpg, .png)
│   │   │       └── stickers/               # 17 Sticker assets (.webp)
│   │   ├── contacts/                       # 304 Contact & Group Chat CSV exports
│   │   │   ├── +1 (310) 690-0438/
│   │   │   ├── +57 300 5978570/
│   │   │   └── ...
│   │   └── whatsapp_all_extracted/         # Complete WhatsApp Business Backup Text Extraction (~670 MB / 2,294 files)
│   │       ├── EXTRACTION_REPORT.md        # Detailed breakdown of all 2,029 processed documents
│   │       ├── markdown_chats/             # Indexed markdown chat exports
│   │       ├── exported_chats/             # Raw text chat transcripts
│   │       ├── Media/                      # Extracted texts from invoices, rate sheets & PDFs
│   │       ├── Databases/                  # WhatsApp msgstore database dumps (.crypt14)
│   │       └── Backups/                    # Status, settings & stickers backups
│   └── liquidaciones/
│       ├── Liquidacion_acompanamiento_presencial.xlsx  # Settlement spreadsheet
│       └── Liquidacion_transporte.xlsx                 # Transport settlement spreadsheet
│
├── MEDICAL_TRIP_COLOMBIA_SAS/              # Raw Google Drive sync mirror
├── organize_data.sh                        # Automation script for uncompressing & structuring
└── rclone.conf                             # Rclone configuration for Google Drive sync
```

---

## 🔄 Updating and Synchronizing Data

To fetch the latest files from Google Drive and automatically re-organize them, run:

```bash
# 1. Sync from Google Drive
export PATH="/Users/miyo123/homebrew/bin:$PATH"
rclone --config ./rclone.conf sync "gdrive:" ./MEDICAL_TRIP_COLOMBIA_SAS --drive-root-folder-id "1urGWZPqQKyONqLjB4bUY1KeR_b0vpTlg" -P

# 2. Extract and structure
bash organize_data.sh
```
