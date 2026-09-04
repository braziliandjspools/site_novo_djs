# Imagens Open Graph / Twitter (1200 × 630)

Coloque aqui um JPG por página. Formato recomendado: **1200×630**, qualidade alta, texto legível.

## Arquivos esperados

| Arquivo | Página |
|---------|--------|
| `default.jpg` | Fallback geral (obrigatório enquanto as outras não existirem) |
| `home.jpg` | `/` |
| `plans.jpg` | `/plans` |
| `deemix.jpg` | `/deemix` |
| `allavsoft.jpg` | `/allavsoft` |
| `musicproducer.jpg` | `/musicproducer` |
| `portal.jpg` | `/portal` |
| `musicas.jpg` | `/musicas` |
| `musicas-home.jpg` | `/musicas/home` |
| `musicas-atualizacoes.jpg` | `/musicas/atualizacoes` |
| `musicas-colecoes.jpg` | `/musicas/colecoes` |
| `musicas-entrar.jpg` | `/musicas/entrar` |
| `privacidade.jpg` | `/privacidade` |
| `termos.jpg` | `/termos` |
| `privacy-downloader.jpg` | `/privacy/downloader` |
| `privacy-cookies.jpg` | `/privacy/cookies` |
| `privacy-conduct.jpg` | `/privacy/conduct` |

## Depois de enviar cada arte

1. Salve o arquivo neste diretório com o nome exato da tabela.
2. Em `app/lib/seo.ts`, adicione o slug em `READY_OG_IMAGES` (ex.: `"home"`).
3. Faça deploy — o Open Graph passa a usar a arte da página.

Enquanto o slug não estiver em `READY_OG_IMAGES`, o site usa `default.jpg`.
