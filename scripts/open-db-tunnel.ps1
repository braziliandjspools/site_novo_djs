# Proxy Postgres no VPS + tunel SSH para desenvolvimento local.
# Deixe esta janela aberta enquanto usa npm run dev.
#
# Uso:
#   .\scripts\open-db-tunnel.ps1 -SshUser root -SshHost 164.163.9.164

param(
  [Parameter(Mandatory = $true)][string]$SshUser,
  [Parameter(Mandatory = $true)][string]$SshHost,
  [string]$RemoteDbContainer = "plataforma-vip-packsdj-stfihn",
  [int]$LocalPort = 15432
)

$ErrorActionPreference = "Stop"
$remote = "${SshUser}@${SshHost}"
$remoteSetup = "/tmp/brs-pg-proxy-setup.sh"
$localSetup = Join-Path $env:TEMP "brs-pg-proxy-setup.sh"

$bash = @'
#!/bin/sh
set -e
CID=$(docker ps -q -f name=__DB_NAME__ | head -n1)
if [ -z "$CID" ]; then
  echo "Container Postgres '__DB_NAME__' nao encontrado." >&2
  exit 1
fi
NET=$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}' "$CID" | awk '{print $1}')
if [ -z "$NET" ]; then
  echo "Rede Docker do Postgres nao encontrada." >&2
  exit 1
fi
docker rm -f brs-pg-proxy >/dev/null 2>&1 || true
docker run -d --name brs-pg-proxy --restart unless-stopped --network "$NET" -p 127.0.0.1:15432:5432 alpine/socat TCP-LISTEN:5432,fork,reuseaddr TCP-CONNECT:__DB_NAME__:5432 >/dev/null
echo "Proxy OK (127.0.0.1:15432 -> __DB_NAME__:5432 na rede $NET)"
'@

$bash = $bash.Replace('__DB_NAME__', $RemoteDbContainer)
$bash = $bash.Replace("`r`n", "`n").Replace("`r", "`n")
[System.IO.File]::WriteAllText($localSetup, $bash)

Write-Host "1/2 Configurando proxy no VPS..."
scp $localSetup "${remote}:${remoteSetup}"
if ($LASTEXITCODE -ne 0) { throw "scp falhou" }
ssh $remote "sh $remoteSetup"
if ($LASTEXITCODE -ne 0) { throw "proxy remoto falhou" }

Write-Host "2/2 Abrindo tunel SSH 127.0.0.1:${LocalPort} -> VPS:15432 ..."
Write-Host "Deixe esta janela aberta. Ctrl+C para fechar."
Write-Host ""
Write-Host "DATABASE_URL deve ser:"
Write-Host "postgresql://ederson:***@127.0.0.1:${LocalPort}/packs_dj"
Write-Host ""

ssh -N -L "127.0.0.1:${LocalPort}:127.0.0.1:15432" -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 $remote
