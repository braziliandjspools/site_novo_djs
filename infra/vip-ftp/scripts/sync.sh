#!/bin/sh
set -eu

REMOTE="${RCLONE_REMOTE:-gdrive}"
FOLDER_ID="${DRIVE_FOLDER_ID:?DRIVE_FOLDER_ID é obrigatório}"
DEST="/data/music"
INTERVAL="${SYNC_INTERVAL_SECONDS:-3600}"
CONFIG="${RCLONE_CONFIG:-/config/rclone/rclone.conf}"

if [ ! -f "$CONFIG" ]; then
  echo "[sync] Falta $CONFIG — copie rclone.conf.example para rclone.conf"
  exit 1
fi

if [ ! -f /config/rclone/service-account.json ]; then
  echo "[sync] Falta /config/rclone/service-account.json"
  exit 1
fi

mkdir -p "$DEST"

# Fonte: pasta específica do Drive (não a raiz da service account)
SOURCE="${REMOTE}:/"
# Com root_folder_id via flag, listamos só o acervo VIP
EXTRA_ARGS="--drive-root-folder-id=${FOLDER_ID}"

echo "[sync] Iniciando espelho Drive → ${DEST} (a cada ${INTERVAL}s)"

while true; do
  echo "[sync] $(date -u +%Y-%m-%dT%H:%M:%SZ) rclone sync…"
  if rclone sync \
    "$SOURCE" \
    "$DEST" \
    --config "$CONFIG" \
    $EXTRA_ARGS \
    --fast-list \
    --transfers 4 \
    --checkers 8 \
    --drive-acknowledge-abuse \
    --log-level INFO \
    --stats 1m \
    --create-empty-src-dirs; then
    # Garante leitura pelo usuário FTP (rclone grava como root)
    chmod -R a+rX "$DEST" 2>/dev/null || true
    echo "[sync] OK"
  else
    echo "[sync] Falha (código $?) — nova tentativa no próximo ciclo"
  fi
  sleep "$INTERVAL"
done
