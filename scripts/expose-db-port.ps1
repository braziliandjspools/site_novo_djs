# Publica o Postgres Dokploy em 0.0.0.0:15432 no VPS (uma vez).
# Depois, no .env local use:
#   DATABASE_URL=postgresql://USER:PASS@164.163.9.164:15432/packs_dj
# sem tunel SSH diario.
#
# Uso:
#   .\scripts\expose-db-port.ps1 -SshUser root -SshHost 164.163.9.164
#
# Seguranca: a porta fica acessivel na internet. Ideal restringir no firewall
# ao seu IP. Nao committe senhas.

param(
  [Parameter(Mandatory = $true)][string]$SshUser,
  [Parameter(Mandatory = $true)][string]$SshHost,
  [string]$RemoteDbContainer = "plataforma-vip-packsdj-stfihn",
  [int]$PublishPort = 15432
)

$ErrorActionPreference = "Stop"
$remote = "${SshUser}@${SshHost}"
$remoteSetup = "/tmp/brs-pg-expose.sh"
$localSetup = Join-Path $env:TEMP "brs-pg-expose.sh"

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
docker run -d --name brs-pg-proxy --restart unless-stopped --network "$NET" -p 0.0.0.0:__PORT__:5432 alpine/socat TCP-LISTEN:5432,fork,reuseaddr TCP-CONNECT:__DB_NAME__:5432 >/dev/null
echo "OK - Postgres publicado em 0.0.0.0:__PORT__ (rede $NET)"
'@

$bash = $bash.Replace('__DB_NAME__', $RemoteDbContainer).Replace('__PORT__', "$PublishPort")
$bash = $bash.Replace("`r`n", "`n").Replace("`r", "`n")
[System.IO.File]::WriteAllText($localSetup, $bash)

Write-Host "Publicando Postgres na porta $PublishPort do VPS..."
scp $localSetup "${remote}:${remoteSetup}"
if ($LASTEXITCODE -ne 0) { throw "scp falhou" }
ssh $remote "sh $remoteSetup"
if ($LASTEXITCODE -ne 0) { throw "expose falhou" }

Write-Host ""
Write-Host "Pronto. No .env / .env.local use:"
Write-Host ("DATABASE_URL=postgresql://ederson:SENHA@{0}:{1}/packs_dj" -f $SshHost, $PublishPort)
Write-Host ("DIRECT_URL=postgresql://ederson:SENHA@{0}:{1}/packs_dj" -f $SshHost, $PublishPort)
Write-Host ""
Write-Host "Reinicie npm run dev. Sem tunel."
Write-Host "Se a porta nao abrir do Windows, no VPS: ufw allow $PublishPort/tcp && ufw reload"
