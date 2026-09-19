#!/bin/bash
set -e

BASE_DIR="/Users/miyo123/projects/medicaltrip"
RAW_DIR="$BASE_DIR/MEDICAL_TRIP_COLOMBIA_SAS"
DATA_DIR="$BASE_DIR/data"

echo "=== 1. Creating Clean Target Directories ==="
PASSENGER_TARGET="$DATA_DIR/chats/passengers/RVA271-5-GitersonZulaica"
CONTACTS_TARGET="$DATA_DIR/chats/contacts"
WHATSAPP_ALL_TARGET="$DATA_DIR/chats/whatsapp_all_extracted"
LIQUIDACIONES_TARGET="$DATA_DIR/liquidaciones"

mkdir -p "$PASSENGER_TARGET/documents"
mkdir -p "$PASSENGER_TARGET/audio"
mkdir -p "$PASSENGER_TARGET/images"
mkdir -p "$PASSENGER_TARGET/stickers"
mkdir -p "$CONTACTS_TARGET"
mkdir -p "$WHATSAPP_ALL_TARGET"
mkdir -p "$LIQUIDACIONES_TARGET"

# 2. Extract Passenger Chat if not already extracted
PASSENGER_ZIP=$(find "$RAW_DIR" -name "*RVA271-5*.zip" -print -quit)
if [ -n "$PASSENGER_ZIP" ]; then
    echo "=== 2. Extracting Passenger Chat ==="
    TMP_P="/tmp/medtrip_passenger_extract"
    rm -rf "$TMP_P" && mkdir -p "$TMP_P"
    ditto -x -k "$PASSENGER_ZIP" "$TMP_P"
    
    find "$TMP_P" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) -exec mv {} "$PASSENGER_TARGET/images/" \;
    find "$TMP_P" -type f \( -iname "*.opus" -o -iname "*.mp3" -o -iname "*.ogg" -o -iname "*.m4a" \) -exec mv {} "$PASSENGER_TARGET/audio/" \;
    find "$TMP_P" -type f \( -iname "*.pdf" -o -iname "*.vcf" -o -iname "*.docx" -o -iname "*.xlsx" \) -exec mv {} "$PASSENGER_TARGET/documents/" \;
    find "$TMP_P" -type f \( -iname "*.webp" \) -exec mv {} "$PASSENGER_TARGET/stickers/" \;
    find "$TMP_P" -type f \( -iname "*.txt" \) -exec cp {} "$PASSENGER_TARGET/chat_history.txt" \;
    find "$TMP_P" -type f -exec mv {} "$PASSENGER_TARGET/" \; 2>/dev/null || true
    rm -rf "$TMP_P"
    echo "Passenger chat organized."
fi

# 3. Extract chat2.zip (contacts CSVs)
CHAT2_ZIP="$RAW_DIR/chats/chat2.zip"
if [ -f "$CHAT2_ZIP" ]; then
    echo "=== 3. Extracting Contacts Chats (chat2.zip) ==="
    TMP_C2="/tmp/medtrip_chat2_extract"
    rm -rf "$TMP_C2" && mkdir -p "$TMP_C2"
    ditto -x -k "$CHAT2_ZIP" "$TMP_C2"
    if [ -d "$TMP_C2/chat2" ]; then
        cp -R "$TMP_C2/chat2/"* "$CONTACTS_TARGET/"
    else
        cp -R "$TMP_C2/"* "$CONTACTS_TARGET/"
    fi
    rm -rf "$TMP_C2"
    echo "Contacts CSV exports organized."
fi

# 4. Extract whatsapp_extracted_texts_all.zip (670 MB complete WhatsApp dump)
WHATSAPP_ALL_ZIP="$RAW_DIR/chats/whatsapp_extracted_texts_all.zip"
if [ -f "$WHATSAPP_ALL_ZIP" ]; then
    echo "=== 4. Extracting Full WhatsApp Extracted Texts (670MB zip) ==="
    TMP_WA="/tmp/medtrip_wa_all_extract"
    rm -rf "$TMP_WA" && mkdir -p "$TMP_WA"
    ditto -x -k "$WHATSAPP_ALL_ZIP" "$TMP_WA"
    
    cp -R "$TMP_WA/"* "$WHATSAPP_ALL_TARGET/"
    rm -rf "$TMP_WA"
    echo "Full WhatsApp archive extracted into $WHATSAPP_ALL_TARGET."
fi

# 5. Copy and Normalize Liquidación Spreadsheets
echo "=== 5. Copying Liquidación Spreadsheets ==="
find "$RAW_DIR" -type f -name "*presencial*.xlsx" -exec cp {} "$LIQUIDACIONES_TARGET/Liquidacion_acompanamiento_presencial.xlsx" \;
find "$RAW_DIR" -type f -name "*transporte*.xlsx" -exec cp {} "$LIQUIDACIONES_TARGET/Liquidacion_transporte.xlsx" \;

echo "=== All Data Successfully Uncompressed and Structured ==="
