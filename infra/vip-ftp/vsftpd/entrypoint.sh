#!/bin/sh
set -eu

FTP_USER="${FTP_USER:?FTP_USER é obrigatório}"
FTP_PASSWORD="${FTP_PASSWORD:?FTP_PASSWORD é obrigatório}"
FTP_PASV_ADDRESS="${FTP_PASV_ADDRESS:?FTP_PASV_ADDRESS é obrigatório (IP público ou domínio)}"
FTP_PASV_MIN="${FTP_PASV_MIN:-21100}"
FTP_PASV_MAX="${FTP_PASV_MAX:-21110}"
MUSIC_ROOT="/data/music"

mkdir -p /var/run/vsftpd/empty "$MUSIC_ROOT"

# Usuário FTP local com home = espelho do Drive
if ! id "$FTP_USER" >/dev/null 2>&1; then
  adduser -D -h "$MUSIC_ROOT" -s /sbin/nologin "$FTP_USER"
fi
echo "${FTP_USER}:${FTP_PASSWORD}" | chpasswd
echo "$FTP_USER" >/etc/vsftpd.userlist

# Garante permissão de leitura no espelho (rclone grava como root)
chown -R "${FTP_USER}:${FTP_USER}" "$MUSIC_ROOT" 2>/dev/null || true
chmod -R a+rX "$MUSIC_ROOT" 2>/dev/null || true

CONF=/etc/vsftpd/vsftpd.conf
cp /etc/vsftpd/vsftpd.conf.template "$CONF"
sed -i "s/^pasv_address=.*/pasv_address=${FTP_PASV_ADDRESS}/" "$CONF"
sed -i "s/^pasv_min_port=.*/pasv_min_port=${FTP_PASV_MIN}/" "$CONF"
sed -i "s/^pasv_max_port=.*/pasv_max_port=${FTP_PASV_MAX}/" "$CONF"

echo "[ftp] vsftpd pronto — user=${FTP_USER} pasv=${FTP_PASV_ADDRESS}:${FTP_PASV_MIN}-${FTP_PASV_MAX}"
exec /usr/sbin/vsftpd "$CONF"
