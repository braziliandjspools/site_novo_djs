# Atualizações do BRS Downloader

O app consulta `GET /api/downloader/updates/latest?current=0.2.0` e avisa no **sininho** quando houver versão mais nova.

## Publicar um novo .exe (dev)

1. Gere o instalador (`npm run tauri build` / pipeline de release).
2. Hospede o `.exe` (R2, S3, Drive público, etc.).
3. No **Vercel → Environment Variables**, defina:

```
DOWNLOADER_LATEST_VERSION=0.5.1_beta
DOWNLOADER_DOWNLOAD_URL=https://seu-cdn/.../BRS-Downloader_0.5.1_beta_x64-setup.exe
DOWNLOADER_RELEASE_NOTES=Notificações traduzidas conforme o idioma (pt-BR, en, es)
DOWNLOADER_RELEASE_PUBLISHED_AT=2026-09-07T15:05:00.000Z
```

4. Faça redeploy do site.
5. No app: Configurações → **Verificar atualizações**, ou aguarde a checagem automática (a cada 6h se a opção estiver ligada).

O usuário clica **Baixar e atualizar** no sininho → abre o instalador → conclui a instalação.

## Preferência no app

Configurações → Windows → **Verificar atualizações do aplicativo** (padrão: ligado).

## Updater nativo Tauri (assinado)

O fluxo com `tauri-plugin-updater` + pubkey permanece opcional (ver histórico / `plugins.updater` em `tauri.conf.json`). O manifesto via site cobre o caso “dev lança .exe e o app avisa” sem assinatura de update.
