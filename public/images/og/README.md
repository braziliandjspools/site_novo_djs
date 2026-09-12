# Imagens Open Graph / Twitter (1200 × 630)

Coloque aqui um JPG por página. Formato: **1200×630**, qualidade alta, texto legível.

## Páginas públicas (prioridade)

| Arquivo | Página |
|---------|--------|
| `default.jpg` | Fallback (obrigatório) |
| `home.jpg` | `/` |
| `plans.jpg` | `/plans` |
| `allavsoft.jpg` | `/allavsoft` |
| `musicproducer.jpg` | `/musicproducer` |
| `musicas-entrar.jpg` | `/musicas/entrar` |
| `gerador-maiusculas` usa `home` / default | `/gerador-maiusculas` |
| `privacidade.jpg` | `/privacidade` |
| `termos.jpg` | `/termos` |
| `privacy-downloader.jpg` | `/privacy/downloader` |
| `privacy-cookies.jpg` | `/privacy/cookies` |
| `privacy-conduct.jpg` | `/privacy/conduct` |

Áreas VIP (`/portal`, `/musicas/home` etc.) são **noindex** — OG dedicado é opcional.

## Depois de enviar cada arte

1. Salve o arquivo neste diretório com o nome exato.
2. Em `app/lib/seo.ts`, adicione o slug em `READY_OG_IMAGES` (ex.: `"home"`).
3. Redeploy.
