# Atualizações do BRS Downloader

O app consulta `GET /api/downloader/updates/latest?current=1.0.7_estable` e avisa no **sininho** / popup quando houver versão mais nova.

A partir da **1.0.4**, o botão **Baixar e atualizar** baixa o `.exe` **por dentro do app** (Rust) e abre o instalador — sem passar pelo navegador.

## Publicar um novo .exe (dev)

1. Bump da versão em `package.json`, `tauri.conf.json`, `Cargo.toml`, `app-info.ts` e `config.ts`.
2. `npm run downloader:release` na raiz do monorepo.
3. Copie o setup para `public/downloads/BRS-Downloader_<versão>_x64-setup.exe`.
4. Atualize `app/lib/downloader-updates.ts` (ou env no Vercel) com versão, URL e notes.
5. Commit + deploy do site.
6. Em um app **anterior**: Configurações → **Verificar atualizações** (ou aguarde até 6h).

## Preferência no app

Configurações → Windows → **Verificar atualizações do aplicativo** (padrão: ligado).

## Updater nativo Tauri (assinado)

O fluxo com `tauri-plugin-updater` + pubkey permanece opcional. O manifesto via site + download interno cobre o lançamento contínuo de betas.
