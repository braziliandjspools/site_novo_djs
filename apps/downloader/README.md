# Brazilian Packs Downloader

Aplicativo desktop (Tauri 2 + React + TypeScript) para baixar músicas enfileiradas na plataforma VIP.

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (para `tauri dev` / `tauri build`)
- [Pré-requisitos do Tauri no Windows](https://tauri.app/start/prerequisites/)

## Configuração

```bash
cd apps/downloader
npm install
cp .env.example .env
```

Variável opcional:

- `VITE_BP_SITE_URL` — URL aberta pelo botão **Abrir Brazilian Packs** (padrão: `http://localhost:3000/musicas/atualizacoes`)

## Comandos

Na raiz do monorepo:

```bash
# Frontend Vite (navegador, porta 1420)
npm run downloader:web:dev

# Build do frontend
npm run downloader:web:build

# App desktop com hot reload (Tauri + Vite)
npm run downloader:dev

# Instalador / binário desktop
npm run downloader:build

# Instalador Windows de produção (NSIS → release/BrazilianPacksDownloader_Setup.exe)
# URL padrão: https://sitenovodjs.vercel.app (altere em scripts/build-downloader-installer.mjs ou via env)
npm run downloader:release

# Auditar secrets nos artefatos de build
npm run downloader:audit
```

Ou dentro de `apps/downloader`:

```bash
npm run dev          # Vite
npm run build        # TypeScript + Vite
npm run tauri dev    # Janela Tauri
npm run tauri build  # Build de produção
```

## Estrutura

```
apps/downloader/
  src/                 # React (UI)
  src-tauri/           # Rust (Tauri)
  public/
```

## Autenticação

O app reutiliza a conta VIP do portal Brazilian Packs:

1. `POST /api/portal/login` com header `X-BP-Client: downloader`
2. Recebe o **mesmo token HMAC** da sessão web (no body, não no executável)
3. Token salvo no **Windows Credential Manager** via Rust (`keyring`)
4. Requisições usam `Authorization: Bearer <token>`
5. Após login, registra o dispositivo em `POST /api/downloader/devices`

**Não é armazenado:** senha, `DATABASE_URL`, secrets do backend.

Variáveis em `.env`:

- `VITE_API_BASE_URL` — API Next.js (padrão `http://localhost:3000`)
- `VITE_BP_SITE_URL` — link “Abrir Brazilian Packs”

## Estado atual

- Layout com sidebar (Downloads / Configurações)
- **Login VIP** com sessão persistente (Credential Manager)
- Registro automático de dispositivo (`deviceId`, hostname, Windows)
- **Fila conectada ao backend** via `DownloadManager` (polling adaptativo)
- Claim automático de jobs `PENDING` → `RECEIVED` (sem download Drive ainda)
- Indicador **Sem conexão** + reconexão automática
- Heartbeat a cada ~60s
- Botão **Abrir Brazilian Packs** (plugin opener)
- Identidade visual alinhada ao `/musicas` do site

### DownloadManager

Arquitetura preparada para trocar REST polling por push/realtime no futuro:

```
DownloadManager
  └── QueueTransport (interface)
        └── createRestQueueTransport()  ← atual
        └── (futuro) PushQueueTransport
```

Polling adaptativo (Neon-friendly):

| Situação | Intervalo |
|----------|-----------|
| Conexão / novo job detectado | imediato + burst 2,5s |
| Jobs PENDING | 2,5s |
| Jobs RECEIVED no dispositivo | 7s |
| Fila vazia (app visível) | 3s |
| Fila vazia (app em background) | 25s |
| Heartbeat | 60s |

Fila local persistida em `localStorage` por `deviceId` (sobrevive a quedas de rede).

## Testes

```bash
# Backend rodando (npm run dev)
node scripts/test-downloader-queue-sync.mjs   # SITE → BANCO → APP
node scripts/test-polling-schedule.mjs        # agendador de polling
node scripts/test-downloader-api.mjs          # APIs completas
```
