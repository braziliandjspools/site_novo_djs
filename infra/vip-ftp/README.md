# Servidor FTP espelho do Google Drive (BRS VIP)

Espelha o acervo VIP do Drive em disco e expõe **FTP somente leitura** para o cliente **FileZilla**.

> Não roda na Vercel. Precisa de um **VPS** (Linux + Docker) com disco suficiente para o acervo.

```text
Google Drive (pasta VIP)
        │  rclone sync (periódico)
        ▼
   Disco do VPS (/data/music)
        │  vsftpd (porta 21 + passivo)
        ▼
   FileZilla  ←  credenciais do /portal/pools (VIP_FTP_*)
```

## Requisitos

- VPS Ubuntu 22.04+ (ou similar) com Docker e Docker Compose
- Disco: dimensionar conforme o tamanho do acervo (SSD recomendado)
- Portas abertas no firewall/security group: **21/tcp** e **21100–21110/tcp** (passivo)
- Conta de serviço Google com acesso à pasta VIP

## 1. Preparar a service account (Google)

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto (ou use um existente).
2. Ative a **Google Drive API**.
3. **IAM → Contas de serviço → Criar** → gere uma chave **JSON**.
4. Salve o arquivo como `infra/vip-ftp/rclone/service-account.json` (não commitar).
5. No Google Drive, **compartilhe a pasta VIP** com o e-mail da service account (`…@….iam.gserviceaccount.com`) como **Leitor**.
6. Anote o **ID da pasta** (mesmo `GOOGLE_DRIVE_VIP_MUSIC_FOLDER_ID` do site).

## 2. Configurar no VPS

```bash
cd infra/vip-ftp
cp .env.example .env
cp rclone/rclone.conf.example rclone/rclone.conf
# coloque service-account.json em rclone/
```

Edite `.env`:

| Variável | Descrição |
|---|---|
| `FTP_USER` / `FTP_PASSWORD` | Login VIP compartilhado (FileZilla + portal) |
| `FTP_PASV_ADDRESS` | **IP público ou domínio do VPS** (obrigatório) |
| `FTP_PORT` | `21` |
| `FTP_PASV_MIN` / `FTP_PASV_MAX` | `21100` / `21110` |
| `DRIVE_FOLDER_ID` | ID da pasta VIP no Drive |
| `SYNC_INTERVAL_SECONDS` | Intervalo do espelho (padrão `3600` = 1h) |
| `RCLONE_REMOTE` | Nome do remote no conf (`gdrive`) |

## 3. Subir o stack

```bash
docker compose up -d --build
docker compose logs -f sync   # primeiro sync pode demorar horas
docker compose logs -f ftp
```

Teste local no VPS:

```bash
docker compose ps
```

No PC, abra o **FileZilla**:

- Protocolo: FTP – Transferência de arquivos
- Host: IP/domínio do VPS
- Porta: 21
- Usuário / senha: os do `.env`
- Modo de transferência: **passivo**

## 4. Ligar ao portal (`/portal/pools`)

No projeto (Vercel **e/ou** Dokploy) → Environment Variables:

| Env do site | Valor |
|---|---|
| `VIP_FTP_HOST` | domínio FTP (ex. `ftp.brazilianremixservice.com.br`) ou IP do VPS |
| `VIP_FTP_PORT` | `21` |
| `VIP_FTP_PROTOCOL` | `ftp` |
| `VIP_FTP_USER` | mesmo `FTP_USER` |
| `VIP_FTP_PASSWORD` | mesmo `FTP_PASSWORD` |

Redeploy o site. Em `/portal/pools` as credenciais FTP passam a aparecer no card FileZilla.

O código que lê essas vars está em `app/lib/portal.ts` (`getVipFtpConfig`).

## 5. DNS na Cloudflare (obrigatório se usar domínio)

Crie um registro **A** (ou AAAA) para o FTP:

| Tipo | Nome | Conteúdo | Proxy |
|---|---|---|---|
| `A` | `ftp` | IP público do VPS | **DNS only** (nuvem **cinza**) |

**Não use proxy laranja (Proxied).** A Cloudflare não encaminha FTP/portas passivas direito — o FileZilla falha com timeout ou “connection refused” se o proxy estiver ligado.

Depois:

1. Espere o DNS propagar (`ping ftp.seudominio.com` deve mostrar o IP do VPS).
2. Em `infra/vip-ftp/.env`, use o **mesmo host** em `FTP_PASV_ADDRESS` (ex. `ftp.brazilianremixservice.com.br`).
3. Reinicie o FTP: `docker compose up -d --force-recreate ftp`.
4. No site, `VIP_FTP_HOST` = o mesmo hostname.

Se preferir só o IP (sem subdomínio), pule o DNS e use o IP em `FTP_PASV_ADDRESS` e `VIP_FTP_HOST`.

## 6. Firewall (exemplo UFW)

```bash
sudo ufw allow 21/tcp
sudo ufw allow 21100:21110/tcp
sudo ufw reload
```

Na cloud (AWS/GCP/Hetzner), libere as mesmas portas no security group.

## Operação

```bash
# Status
docker compose ps

# Forçar restart do sync
docker compose restart sync

# Atualizar imagens / rebuild FTP
docker compose pull
docker compose up -d --build

# Parar
docker compose down
```

O volume Docker `brs-vip-ftp-music` guarda o espelho. `docker compose down -v` **apaga** os arquivos baixados.

## Segurança

- FTP sem TLS (texto claro). Use rede confiável ou planeje FTPS depois.
- Senha forte e compartilhada só com assinantes VIP.
- `service-account.json` e `.env` estão no `.gitignore` local — nunca commitá-los.
- Servidor é **somente leitura** (`write_enable=NO`).

## Estrutura

```text
infra/vip-ftp/
  docker-compose.yml
  .env.example
  README.md
  rclone/
    rclone.conf.example
    service-account.json   # você cria (gitignored)
  scripts/sync.sh
  vsftpd/
    Dockerfile
    entrypoint.sh
    vsftpd.conf
```

## Limitações

- Primeiro sync é lento e usa muita banda/disco.
- Há atraso entre upload no Drive e aparecer no FTP (até `SYNC_INTERVAL_SECONDS`).
- Conta FTP **única** para todos os VIP (não é por assinante).
- O site `/musicas` continua lendo o Drive direto; este stack só alimenta o FTP.
