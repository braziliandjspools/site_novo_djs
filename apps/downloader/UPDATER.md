# Tauri Updater — Brazilian Packs Downloader

Estrutura preparada, **desativada por padrão** (`plugins.updater.active: false` em `src-tauri/tauri.conf.json`).

Não há servidor de updates configurado. Ative somente quando houver endpoint real e chaves de assinatura.

## 1. Gerar par de chaves (uma vez)

```powershell
cd apps/downloader
npm run tauri signer generate -w "$env:USERPROFILE\.tauri\brazilian-packs-downloader.key"
```

Guarde a chave privada em local seguro. Perder a chave impede publicar updates para usuários já instalados.

## 2. Configurar `tauri.conf.json`

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "active": true,
      "pubkey": "<conteúdo de .key.pub>",
      "endpoints": [
        "https://SEU_DOMINIO/api/downloader/updates/{{target}}/{{arch}}/{{current_version}}"
      ]
    }
  }
}
```

Substitua `SEU_DOMINIO` pelo host real quando o endpoint existir no backend.

## 3. Build com assinatura

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "$env:USERPROFILE\.tauri\brazilian-packs-downloader.key"
npm run downloader:release
```

## 4. Formato esperado do endpoint (referência)

O servidor deve responder JSON no formato Tauri v2 quando houver update disponível. Implemente no site antes de ativar `active: true`.

## 5. Cliente (frontend)

`src/lib/updater.ts` expõe `checkForAppUpdates()` — só executa se `VITE_UPDATER_ENABLED=true` no build.
