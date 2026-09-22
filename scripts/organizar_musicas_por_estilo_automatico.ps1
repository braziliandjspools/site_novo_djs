#Requires -Version 5.1
<#
.SYNOPSIS
  BRS - Organizador automatico de musicas por estilo (pesquisa online + OpenRouter).

.DESCRIPTION
  Detecta a pasta atual como raiz, vasculha o acervo, enriquece metadados via APIs,
  classifica com IA (OpenRouter) e organiza em pastas de estilo na raiz.

  Padrao: $MODO_TESTE = $true (nao move arquivos).

.NOTES
  Credenciais apenas via variaveis de ambiente:
    OPENROUTER_API_KEY   (obrigatoria para classificar novos)
    OPENROUTER_MODEL     (opcional)
    SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (opcional)
    LASTFM_API_KEY (opcional)
#>

# ============================================================
# CONFIGURACAO
# ============================================================

$MODO_TESTE = $true
$TAMANHO_LOTE = 30
$CONFIANCA_MINIMA = 0.65
$MOVER_NAO_CLASSIFICADOS = $false

$OPENROUTER_MODEL_PADRAO = 'openai/gpt-4o-mini'
$MUSICBRAINZ_USER_AGENT = 'BrazilianRemixService-MusicOrganizer/1.0 (contato: brazilianremixservice@gmail.com)'
$MUSICBRAINZ_PAUSE_MS = 1100
$API_RETRY_MAX = 3
$PASTA_RETRY_MAX = 3
$PASTA_RETRY_SLEEP_SEC = 2

# Categorias permitidas (aspas simples protegem o & no Windows PowerShell 5.1)
$ESTILOS_PERMITIDOS = @(
    'SERTANEJO',
    'AGRO & COUNTRY',
    ('FORR' + [char]0x00D3 + ' & PISEIRO'),
    'FUNK',
    'ELETROFUNK & MTG',
    'PAGODE & SAMBA',
    'BREGA & ARROCHA',
    ('AX' + [char]0x00C9 + ' & PAGOD' + [char]0x00C3 + 'O'),
    'MPB',
    'POP & URBANO',
    'RAP & TRAP',
    'ROCK',
    'REGGAE',
    'LATINO',
    'FLASHBACK',
    'HOUSE',
    'TECH HOUSE',
    'DEEP HOUSE',
    'DISCO HOUSE',
    'AFRO HOUSE',
    'LATIN HOUSE',
    'BRAZILIAN BASS',
    'BASS HOUSE',
    'FUTURE HOUSE',
    'COMMERCIAL DANCE & EDM',
    'MAINSTAGE & EURODANCE',
    'PROGRESSIVE HOUSE',
    'MELODIC HOUSE & TECHNO',
    'TECHNO',
    'HARD TECHNO',
    'TRANCE',
    'PSYTRANCE',
    'HARDSTYLE',
    'DRUM & BASS',
    'UK GARAGE & BASS',
    'DUBSTEP',
    'BREAKS',
    'SLAP HOUSE',
    'OUTROS',
    'NAO CLASSIFICADO'
)

$script:EstiloForro = $ESTILOS_PERMITIDOS[2]
$script:EstiloAxe = $ESTILOS_PERMITIDOS[7]

$EXTENSOES_AUDIO = @('.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.aiff', '.aif')
$PASTAS_IGNORAR_NOME = @('.git', 'node_modules', '.cache', 'temp', 'tmp', '.brs-cache', '__MACOSX')
$REGEX_PASTA_DATA = '^\d{2}-\d{2}-\d{4}$'

# ============================================================
# ESTADO GLOBAL
# ============================================================

$script:Raiz = (Get-Location).Path
$script:CacheClassificacaoPath = Join-Path $script:Raiz '.brs-estilos-cache.json'
$script:CacheMetadataPath = Join-Path $script:Raiz '.brs-music-metadata-cache.json'
$script:LogPath = Join-Path $script:Raiz 'BRS_ORGANIZADOR.log'
$script:CsvPath = Join-Path $script:Raiz 'BRS_CLASSIFICACAO.csv'

$script:CacheClassificacao = @{}
$script:CacheMetadata = @{}
$script:RelatorioLinhas = New-Object System.Collections.Generic.List[object]
$script:SpotifyToken = $null
$script:SpotifyTokenExpira = [datetime]::MinValue

$script:Stats = [ordered]@{
    PastasAnalisadas       = 0
    ArquivosEncontrados    = 0
    JaNoCache              = 0
    Pesquisados            = 0
    Classificados          = 0
    NaoClassificados       = 0
    Movidos                = 0
    Simulados              = 0
    JaExistentes           = 0
    Erros                  = 0
    ChamadasMusicBrainz    = 0
    ChamadasDeezer         = 0
    ChamadasSpotify        = 0
    ChamadasLastFm         = 0
    ChamadasOpenRouter     = 0
    PastasCriadas          = 0
}

# ============================================================
# UTF-8 / CONSOLE
# ============================================================

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
    if ($PSVersionTable.PSVersion.Major -ge 7) {
        $PSDefaultParameterValues['*:Encoding'] = 'utf8'
    }
} catch { }

function Write-BrsBanner {
    param([string]$Titulo)
    Write-Host ''
    Write-Host ('=' * 60)
    Write-Host $Titulo
    Write-Host ('=' * 60)
}

function Write-BrsLog {
    param(
        [string]$Mensagem,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'DEBUG')]
        [string]$Nivel = 'INFO'
    )
    $linha = '[{0}] [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Nivel, $Mensagem
    try {
        Add-Content -LiteralPath $script:LogPath -Value $linha -Encoding UTF8 -ErrorAction SilentlyContinue
    } catch { }
    switch ($Nivel) {
        'ERROR' { Write-Host $linha -ForegroundColor Red }
        'WARN'  { Write-Host $linha -ForegroundColor Yellow }
        'DEBUG' { }
        default { }
    }
}

function ConvertTo-BrsHashtable {
    param($InputObject)
    if ($null -eq $InputObject) { return @{} }
    if ($InputObject -is [hashtable]) { return $InputObject }
    if ($InputObject -is [System.Collections.IDictionary]) {
        $h = @{}
        foreach ($k in $InputObject.Keys) {
            $h[[string]$k] = ConvertTo-BrsHashtable $InputObject[$k]
        }
        return $h
    }
    if ($InputObject -is [System.Collections.IEnumerable] -and -not ($InputObject -is [string])) {
        $list = @()
        foreach ($item in $InputObject) {
            $list += ,(ConvertTo-BrsHashtable $item)
        }
        return $list
    }
    if ($InputObject -is [psobject] -and $InputObject.PSObject.Properties.Count -gt 0 -and -not ($InputObject -is [ValueType])) {
        $h = @{}
        foreach ($p in $InputObject.PSObject.Properties) {
            if ($p.Name -match '^PS') { continue }
            $h[$p.Name] = ConvertTo-BrsHashtable $p.Value
        }
        if ($h.Count -gt 0) { return $h }
    }
    return $InputObject
}

function ConvertFrom-BrsJsonSafe {
    param([string]$Texto)
    if ([string]::IsNullOrWhiteSpace($Texto)) { return $null }
    $clean = $Texto.Trim()
    if ($clean.StartsWith('```')) {
        $clean = $clean -replace '^```(?:json)?\s*', ''
        $clean = $clean -replace '\s*```$', ''
        $clean = $clean.Trim()
    }
    $startArr = $clean.IndexOf('[')
    $startObj = $clean.IndexOf('{')
    if ($startArr -ge 0 -and ($startObj -lt 0 -or $startArr -lt $startObj)) {
        $end = $clean.LastIndexOf(']')
        if ($end -gt $startArr) { $clean = $clean.Substring($startArr, $end - $startArr + 1) }
    } elseif ($startObj -ge 0) {
        $end = $clean.LastIndexOf('}')
        if ($end -gt $startObj) { $clean = $clean.Substring($startObj, $end - $startObj + 1) }
    }
    try {
        return ($clean | ConvertFrom-Json)
    } catch {
        Write-BrsLog ("JSON invalido: {0}" -f $_.Exception.Message) 'WARN'
        return $null
    }
}

function Get-BrsHttpStatusCode {
    param($ErrorRecord)
    try {
        if ($ErrorRecord.Exception.Response -and $ErrorRecord.Exception.Response.StatusCode) {
            return [int]$ErrorRecord.Exception.Response.StatusCode
        }
    } catch { }
    try {
        if ($ErrorRecord.ErrorDetails -and $ErrorRecord.ErrorDetails.Message -match '(\d{3})') {
            return [int]$Matches[1]
        }
    } catch { }
    return 0
}

function Get-BrsRetryAfterSeconds {
    param($ErrorRecord)
    try {
        $headers = $ErrorRecord.Exception.Response.Headers
        if ($null -ne $headers) {
            $val = $headers['Retry-After']
            if ($val) {
                $sec = 0
                if ([int]::TryParse([string]$val, [ref]$sec)) { return [Math]::Max(1, $sec) }
            }
        }
    } catch { }
    return 0
}

function Invoke-WithRetry {
    param(
        [Parameter(Mandatory = $true)]
        [scriptblock]$ScriptBlock,
        [int]$MaxAttempts = $API_RETRY_MAX,
        [string]$Operacao = 'HTTP'
    )
    $delays = @(2, 5, 10)
    $ultimoErro = $null
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            return & $ScriptBlock
        } catch {
            $ultimoErro = $_
            $code = Get-BrsHttpStatusCode $_
            $msg = $_.Exception.Message
            $retriable = $false
            if ($code -in @(429, 500, 502, 503, 504)) { $retriable = $true }
            if ($msg -match 'timed? ?out|Unable to connect|DNS|resolv|conex|connection|network|nome nao|name or service|temporarily') {
                $retriable = $true
            }
            if (-not $retriable -or $i -ge $MaxAttempts) {
                throw
            }
            $wait = 0
            if ($code -eq 429) {
                $wait = Get-BrsRetryAfterSeconds $_
            }
            if ($wait -le 0) {
                $idx = [Math]::Min($i - 1, $delays.Count - 1)
                $wait = $delays[$idx]
            }
            Write-BrsLog ("{0}: tentativa {1}/{2} falhou (HTTP {3}). Aguardando {4}s..." -f $Operacao, $i, $MaxAttempts, $code, $wait) 'WARN'
            Start-Sleep -Seconds $wait
        }
    }
    if ($ultimoErro) { throw $ultimoErro }
}

# ============================================================
# CACHE
# ============================================================

function Load-ClassificationCache {
    if (-not (Test-Path -LiteralPath $script:CacheClassificacaoPath)) {
        $script:CacheClassificacao = @{}
        return
    }
    try {
        $raw = Get-Content -LiteralPath $script:CacheClassificacaoPath -Raw -Encoding UTF8
        $obj = ConvertFrom-BrsJsonSafe $raw
        $script:CacheClassificacao = @{}
        if ($null -ne $obj) {
            foreach ($p in $obj.PSObject.Properties) {
                $script:CacheClassificacao[$p.Name] = @{
                    estilo    = [string]$p.Value.estilo
                    confianca = [double]$p.Value.confianca
                }
            }
        }
        Write-BrsLog ("Cache classificacao carregado: {0} entradas" -f $script:CacheClassificacao.Count)
    } catch {
        Write-BrsLog ("Falha ao ler cache classificacao: {0}" -f $_.Exception.Message) 'WARN'
        $script:CacheClassificacao = @{}
    }
}

function Save-ClassificationCache {
    try {
        $ordered = [ordered]@{}
        foreach ($k in ($script:CacheClassificacao.Keys | Sort-Object)) {
            $ordered[$k] = $script:CacheClassificacao[$k]
        }
        $json = $ordered | ConvertTo-Json -Depth 8
        [System.IO.File]::WriteAllText($script:CacheClassificacaoPath, $json, [System.Text.UTF8Encoding]::new($false))
    } catch {
        Write-BrsLog ("Falha ao salvar cache classificacao: {0}" -f $_.Exception.Message) 'ERROR'
        $script:Stats.Erros++
    }
}

function Load-MetadataCache {
    if (-not (Test-Path -LiteralPath $script:CacheMetadataPath)) {
        $script:CacheMetadata = @{}
        return
    }
    try {
        $raw = Get-Content -LiteralPath $script:CacheMetadataPath -Raw -Encoding UTF8
        $obj = ConvertFrom-BrsJsonSafe $raw
        $script:CacheMetadata = @{}
        if ($null -ne $obj) {
            foreach ($p in $obj.PSObject.Properties) {
                $script:CacheMetadata[$p.Name] = ConvertTo-BrsHashtable $p.Value
            }
        }
        Write-BrsLog ("Cache metadata carregado: {0} entradas" -f $script:CacheMetadata.Count)
    } catch {
        Write-BrsLog ("Falha ao ler cache metadata: {0}" -f $_.Exception.Message) 'WARN'
        $script:CacheMetadata = @{}
    }
}

function Save-MetadataCache {
    try {
        $ordered = [ordered]@{}
        foreach ($k in ($script:CacheMetadata.Keys | Sort-Object)) {
            $ordered[$k] = $script:CacheMetadata[$k]
        }
        $json = $ordered | ConvertTo-Json -Depth 12
        [System.IO.File]::WriteAllText($script:CacheMetadataPath, $json, [System.Text.UTF8Encoding]::new($false))
    } catch {
        Write-BrsLog ("Falha ao salvar cache metadata: {0}" -f $_.Exception.Message) 'ERROR'
        $script:Stats.Erros++
    }
}

# ============================================================
# PARSE DE NOME / NORMALIZACAO
# ============================================================

function Normalize-SearchText {
    param(
        [string]$Texto,
        [switch]$PreservarRemix
    )
    if ([string]::IsNullOrWhiteSpace($Texto)) { return '' }
    $t = $Texto.Trim()
    $remover = @(
        'Radio Edit', 'Extended Mix', 'Extended', 'Original Mix', 'Official Video',
        'Official Audio', 'Official', 'Bonus Track', 'Ao Vivo', 'Live',
        'Explicit', 'Clean Version', 'Clean', 'Remastered', 'Remaster',
        'feat\.', 'ft\.', 'featuring'
    )
    foreach ($r in $remover) {
        $t = [regex]::Replace($t, '(?i)\b' + $r + '\b', ' ')
    }
    if (-not $PreservarRemix) {
        $t = [regex]::Replace($t, '(?i)\b(remix|rework|bootleg|edit|mix)\b', ' ')
    }
    $t = $t -replace '[\[\]\(\)]', ' '
    $t = $t -replace '\s+', ' '
    return $t.Trim(' ', '-', '_')
}

function Get-InfoArquivo {
    param([string]$NomeArquivo)
    $base = [System.IO.Path]::GetFileNameWithoutExtension($NomeArquivo)
    $artista = ''
    $titulo = $base
    $versao = ''

    if ($base -match '^\s*(.+?)\s+-\s+(.+)\s*$') {
        $artista = $Matches[1].Trim()
        $resto = $Matches[2].Trim()

        if ($resto -match '^(.*?)\s+-\s+(.+?)\s*$') {
            $titulo = $Matches[1].Trim()
            $versao = $Matches[2].Trim()
        } elseif ($resto -match '^(.*?)(\s*[\(\[][^)\]]*(?:Remix|Rework|Bootleg|Edit|Mix|Version)[^)\]]*[\)\]])\s*$') {
            $titulo = $Matches[1].Trim()
            $versao = $Matches[2].Trim().Trim('()[] ')
        } else {
            $titulo = $resto
        }
    }

    return [pscustomobject]@{
        Arquivo       = $NomeArquivo
        Artista       = $artista
        Titulo        = $titulo
        Versao        = $versao
        ArtistaBusca  = (Normalize-SearchText -Texto $artista -PreservarRemix)
        TituloBusca   = (Normalize-SearchText -Texto $titulo -PreservarRemix)
        VersaoBusca   = $versao
    }
}

# ============================================================
# VARREDURA SEGURA (FILA) - rclone friendly
# ============================================================

function Test-BrsIgnorarPasta {
    param([string]$NomePasta)
    if ([string]::IsNullOrWhiteSpace($NomePasta)) { return $true }
    if ($PASTAS_IGNORAR_NOME -contains $NomePasta) { return $true }
    if ($NomePasta -match $REGEX_PASTA_DATA) { return $true }
    if ($ESTILOS_PERMITIDOS -contains $NomePasta) { return $true }
    # Variantes ASCII sem acento
    $norm = $NomePasta.ToUpperInvariant()
    foreach ($e in $ESTILOS_PERMITIDOS) {
        if ($e.ToUpperInvariant() -eq $norm) { return $true }
    }
    return $false
}

function Get-ChildItemsSafe {
    param(
        [string]$Path,
        [switch]$Directories,
        [switch]$Files
    )
    $attempt = 0
    while ($attempt -lt $PASTA_RETRY_MAX) {
        $attempt++
        try {
            if ($Directories) {
                return @(Get-ChildItem -LiteralPath $Path -Directory -Force -ErrorAction Stop)
            }
            if ($Files) {
                return @(Get-ChildItem -LiteralPath $Path -File -Force -ErrorAction Stop)
            }
            return @(Get-ChildItem -LiteralPath $Path -Force -ErrorAction Stop)
        } catch {
            Write-BrsLog ("Falha ao listar '{0}' (tentativa {1}/{2}): {3}" -f $Path, $attempt, $PASTA_RETRY_MAX, $_.Exception.Message) 'WARN'
            if ($attempt -lt $PASTA_RETRY_MAX) {
                Start-Sleep -Seconds $PASTA_RETRY_SLEEP_SEC
            } else {
                $script:Stats.Erros++
                return @()
            }
        }
    }
    return @()
}

function Get-Musicas {
    Write-Host 'Mapeando arquivos...'
    $fila = New-Object System.Collections.Generic.Queue[string]
    $visitados = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    $musicas = New-Object System.Collections.Generic.List[object]

    [void]$fila.Enqueue($script:Raiz)
    [void]$visitados.Add($script:Raiz)

    $extSet = New-Object 'System.Collections.Generic.HashSet[string]' ([StringComparer]::OrdinalIgnoreCase)
    foreach ($e in $EXTENSOES_AUDIO) { [void]$extSet.Add($e) }

    while ($fila.Count -gt 0) {
        $atual = $fila.Dequeue()
        $script:Stats.PastasAnalisadas++

        $dirs = Get-ChildItemsSafe -Path $atual -Directories
        foreach ($d in $dirs) {
            if (Test-BrsIgnorarPasta -NomePasta $d.Name) { continue }
            if ($visitados.Add($d.FullName)) {
                $fila.Enqueue($d.FullName)
            }
        }

        $files = Get-ChildItemsSafe -Path $atual -Files
        foreach ($f in $files) {
            if (-not $extSet.Contains($f.Extension)) { continue }

            # Nao reprocessar se ja estiver em pasta de estilo na raiz
            try {
                $rel = $f.FullName.Substring($script:Raiz.Length).TrimStart('\', '/')
                $primeiro = ($rel -split '[\\/]')[0]
                if ($ESTILOS_PERMITIDOS -contains $primeiro) { continue }
            } catch { }

            $musicas.Add([pscustomobject]@{
                FullName  = $f.FullName
                Name      = $f.Name
                Directory = $f.DirectoryName
                Extension = $f.Extension
                Length    = $f.Length
            })
        }
    }

    $script:Stats.ArquivosEncontrados = $musicas.Count
    return $musicas
}

# ============================================================
# APIs ONLINE
# ============================================================

function Search-MusicBrainz {
    param(
        [string]$Artista,
        [string]$Titulo
    )
    $resultado = @{
        titulo  = ''
        artista = ''
        generos = @()
        tags    = @()
        data    = ''
        release = ''
        resumo  = ''
    }
    try {
        $parts = @()
        if ($Titulo) { $parts += ('recording:"{0}"' -f ($Titulo -replace '"', '')) }
        if ($Artista) { $parts += ('artist:"{0}"' -f ($Artista -replace '"', '')) }
        if ($parts.Count -eq 0) { return $resultado }

        $query = [uri]::EscapeDataString(($parts -join ' AND '))
        $url = 'https://musicbrainz.org/ws/2/recording/?query={0}&fmt=json&limit=5' -f $query
        $headers = @{ 'User-Agent' = $MUSICBRAINZ_USER_AGENT; 'Accept' = 'application/json' }

        $script:Stats.ChamadasMusicBrainz++
        $resp = Invoke-WithRetry -Operacao 'MusicBrainz' -ScriptBlock {
            Invoke-RestMethod -Uri $url -Headers $headers -Method Get -TimeoutSec 30
        }
        Start-Sleep -Milliseconds $MUSICBRAINZ_PAUSE_MS

        if ($resp.recordings -and $resp.recordings.Count -gt 0) {
            $rec = $resp.recordings[0]
            $resultado.titulo = [string]$rec.title
            if ($rec.'artist-credit') {
                $noms = @()
                foreach ($ac in $rec.'artist-credit') {
                    if ($ac.name) { $noms += $ac.name }
                    elseif ($ac.artist -and $ac.artist.name) { $noms += $ac.artist.name }
                }
                $resultado.artista = ($noms -join ', ')
            }
            if ($rec.tags) {
                foreach ($tg in $rec.tags) {
                    if ($tg.name) { $resultado.tags += [string]$tg.name }
                }
            }
            if ($rec.releases -and $rec.releases.Count -gt 0) {
                $rel = $rec.releases[0]
                $resultado.release = [string]$rel.title
                if ($rel.date) { $resultado.data = [string]$rel.date }
            }

            # Tags do artista (1a credit)
            try {
                $artistId = $null
                if ($rec.'artist-credit' -and $rec.'artist-credit'[0].artist.id) {
                    $artistId = $rec.'artist-credit'[0].artist.id
                }
                if ($artistId) {
                    $aUrl = 'https://musicbrainz.org/ws/2/artist/{0}?inc=genres+tags&fmt=json' -f $artistId
                    $script:Stats.ChamadasMusicBrainz++
                    $aResp = Invoke-WithRetry -Operacao 'MusicBrainz-Artist' -ScriptBlock {
                        Invoke-RestMethod -Uri $aUrl -Headers $headers -Method Get -TimeoutSec 30
                    }
                    Start-Sleep -Milliseconds $MUSICBRAINZ_PAUSE_MS
                    if ($aResp.genres) {
                        foreach ($g in $aResp.genres) {
                            if ($g.name) { $resultado.generos += [string]$g.name }
                        }
                    }
                    if ($aResp.tags) {
                        foreach ($tg in $aResp.tags | Select-Object -First 8) {
                            if ($tg.name) { $resultado.tags += [string]$tg.name }
                        }
                    }
                }
            } catch {
                Write-BrsLog ("MusicBrainz artist tags: {0}" -f $_.Exception.Message) 'DEBUG'
            }
        }

        $all = @()
        $all += $resultado.generos
        $all += $resultado.tags
        $resultado.resumo = (($all | Select-Object -Unique) -join ' / ')
    } catch {
        Write-BrsLog ("MusicBrainz: {0}" -f $_.Exception.Message) 'WARN'
    }
    return $resultado
}

function Search-Deezer {
    param(
        [string]$Artista,
        [string]$Titulo
    )
    $resultado = @{
        titulo        = ''
        artista       = ''
        album         = ''
        genero        = ''
        contributors  = @()
        duracao       = 0
        resumo        = ''
    }
    try {
        $qParts = @()
        if ($Artista) { $qParts += ('artist:"{0}"' -f ($Artista -replace '"', '')) }
        if ($Titulo) { $qParts += ('track:"{0}"' -f ($Titulo -replace '"', '')) }
        if ($qParts.Count -eq 0) {
            $q = Normalize-SearchText -Texto ("{0} {1}" -f $Artista, $Titulo) -PreservarRemix
        } else {
            $q = $qParts -join ' '
        }
        $url = 'https://api.deezer.com/search?q={0}&limit=5' -f [uri]::EscapeDataString($q)

        $script:Stats.ChamadasDeezer++
        $resp = Invoke-WithRetry -Operacao 'Deezer' -ScriptBlock {
            Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30
        }

        if ($resp.data -and $resp.data.Count -gt 0) {
            $t = $resp.data[0]
            $resultado.titulo = [string]$t.title
            if ($t.artist) { $resultado.artista = [string]$t.artist.name }
            if ($t.album) { $resultado.album = [string]$t.album.title }
            if ($t.duration) { $resultado.duracao = [int]$t.duration }
            if ($t.contributors) {
                foreach ($c in $t.contributors) {
                    if ($c.name) { $resultado.contributors += [string]$c.name }
                }
            }

            # Genero via album se disponivel
            if ($t.album -and $t.album.id) {
                try {
                    $aUrl = 'https://api.deezer.com/album/{0}' -f $t.album.id
                    $script:Stats.ChamadasDeezer++
                    $alb = Invoke-WithRetry -Operacao 'Deezer-Album' -ScriptBlock {
                        Invoke-RestMethod -Uri $aUrl -Method Get -TimeoutSec 30
                    }
                    if ($alb.genres -and $alb.genres.data) {
                        $gens = @()
                        foreach ($g in $alb.genres.data) {
                            if ($g.name) { $gens += [string]$g.name }
                        }
                        $resultado.genero = ($gens -join ' / ')
                    }
                } catch { }
            }
        }

        $resumo = @()
        if ($resultado.genero) { $resumo += $resultado.genero }
        if ($resultado.artista) { $resumo += $resultado.artista }
        $resultado.resumo = ($resumo -join ' | ')
    } catch {
        Write-BrsLog ("Deezer: {0}" -f $_.Exception.Message) 'WARN'
    }
    return $resultado
}

function Get-SpotifyToken {
    if ($script:SpotifyToken -and (Get-Date) -lt $script:SpotifyTokenExpira) {
        return $script:SpotifyToken
    }
    $cid = $env:SPOTIFY_CLIENT_ID
    $sec = $env:SPOTIFY_CLIENT_SECRET
    if ([string]::IsNullOrWhiteSpace($cid) -or [string]::IsNullOrWhiteSpace($sec)) {
        return $null
    }
    try {
        $pair = '{0}:{1}' -f $cid, $sec
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($pair)
        $b64 = [Convert]::ToBase64String($bytes)
        $headers = @{
            Authorization = 'Basic ' + $b64
            'Content-Type' = 'application/x-www-form-urlencoded'
        }
        $body = 'grant_type=client_credentials'
        $script:Stats.ChamadasSpotify++
        $tok = Invoke-WithRetry -Operacao 'Spotify-Token' -ScriptBlock {
            Invoke-RestMethod -Uri 'https://accounts.spotify.com/api/token' -Method Post -Headers $headers -Body $body -TimeoutSec 30
        }
        $script:SpotifyToken = $tok.access_token
        $expires = 3600
        if ($tok.expires_in) { $expires = [int]$tok.expires_in }
        $script:SpotifyTokenExpira = (Get-Date).AddSeconds($expires - 60)
        return $script:SpotifyToken
    } catch {
        Write-BrsLog ("Spotify token: {0}" -f $_.Exception.Message) 'WARN'
        return $null
    }
}

function Search-Spotify {
    param(
        [string]$Artista,
        [string]$Titulo
    )
    $resultado = @{
        nome            = ''
        artista         = ''
        album           = ''
        popularidade    = 0
        artistas        = @()
        genres          = @()
        resumo          = ''
    }
    $token = Get-SpotifyToken
    if (-not $token) { return $resultado }

    try {
        $qParts = @()
        if ($Artista) { $qParts += ('artist:{0}' -f $Artista) }
        if ($Titulo) { $qParts += ('track:{0}' -f $Titulo) }
        $q = if ($qParts.Count -gt 0) { $qParts -join ' ' } else { '{0} {1}' -f $Artista, $Titulo }
        $url = 'https://api.spotify.com/v1/search?q={0}&type=track&limit=5' -f [uri]::EscapeDataString($q)
        $headers = @{ Authorization = 'Bearer ' + $token }

        $script:Stats.ChamadasSpotify++
        $resp = Invoke-WithRetry -Operacao 'Spotify-Search' -ScriptBlock {
            Invoke-RestMethod -Uri $url -Headers $headers -Method Get -TimeoutSec 30
        }

        if ($resp.tracks -and $resp.tracks.items -and $resp.tracks.items.Count -gt 0) {
            $tr = $resp.tracks.items[0]
            $resultado.nome = [string]$tr.name
            if ($tr.album) { $resultado.album = [string]$tr.album.name }
            if ($null -ne $tr.popularity) { $resultado.popularidade = [int]$tr.popularity }

            $artistIds = @()
            if ($tr.artists) {
                foreach ($a in $tr.artists) {
                    if ($a.name) {
                        $resultado.artistas += [string]$a.name
                    }
                    if ($a.id) { $artistIds += $a.id }
                }
                $resultado.artista = ($resultado.artistas -join ', ')
            }

            foreach ($aid in ($artistIds | Select-Object -First 3)) {
                try {
                    $aUrl = 'https://api.spotify.com/v1/artists/{0}' -f $aid
                    $script:Stats.ChamadasSpotify++
                    $ar = Invoke-WithRetry -Operacao 'Spotify-Artist' -ScriptBlock {
                        Invoke-RestMethod -Uri $aUrl -Headers $headers -Method Get -TimeoutSec 30
                    }
                    if ($ar.genres) {
                        foreach ($g in $ar.genres) {
                            if ($g) { $resultado.genres += [string]$g }
                        }
                    }
                } catch { }
            }
        }

        $resultado.genres = @($resultado.genres | Select-Object -Unique)
        $resultado.resumo = ($resultado.genres -join ' / ')
    } catch {
        Write-BrsLog ("Spotify: {0}" -f $_.Exception.Message) 'WARN'
    }
    return $resultado
}

function Search-LastFm {
    param(
        [string]$Artista,
        [string]$Titulo
    )
    $resultado = @{
        tags   = @()
        resumo = ''
    }
    $key = $env:LASTFM_API_KEY
    if ([string]::IsNullOrWhiteSpace($key)) { return $resultado }
    if ([string]::IsNullOrWhiteSpace($Artista) -and [string]::IsNullOrWhiteSpace($Titulo)) { return $resultado }

    try {
        if ($Artista -and $Titulo) {
            $url = 'https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key={0}&artist={1}&track={2}&format=json' -f `
                [uri]::EscapeDataString($key),
                [uri]::EscapeDataString($Artista),
                [uri]::EscapeDataString($Titulo)
            $script:Stats.ChamadasLastFm++
            $resp = Invoke-WithRetry -Operacao 'LastFm-Track' -ScriptBlock {
                Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30
            }
            if ($resp.track -and $resp.track.toptags -and $resp.track.toptags.tag) {
                foreach ($tg in $resp.track.toptags.tag) {
                    $nome = $tg.name
                    if (-not $nome -and $tg -is [string]) { $nome = $tg }
                    if ($nome) { $resultado.tags += [string]$nome }
                }
            }
        }

        if ($Artista) {
            $url2 = 'https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&api_key={0}&artist={1}&format=json' -f `
                [uri]::EscapeDataString($key),
                [uri]::EscapeDataString($Artista)
            $script:Stats.ChamadasLastFm++
            $resp2 = Invoke-WithRetry -Operacao 'LastFm-Artist' -ScriptBlock {
                Invoke-RestMethod -Uri $url2 -Method Get -TimeoutSec 30
            }
            if ($resp2.toptags -and $resp2.toptags.tag) {
                foreach ($tg in ($resp2.toptags.tag | Select-Object -First 10)) {
                    $nome = $tg.name
                    if ($nome) { $resultado.tags += [string]$nome }
                }
            }
        }

        $resultado.tags = @($resultado.tags | Select-Object -Unique)
        $resultado.resumo = ($resultado.tags -join ' / ')
    } catch {
        Write-BrsLog ("Last.fm: {0}" -f $_.Exception.Message) 'WARN'
    }
    return $resultado
}

function Get-OnlineMetadata {
    param(
        [Parameter(Mandatory = $true)]
        $InfoArquivo
    )
    $key = $InfoArquivo.Arquivo
    if ($script:CacheMetadata.ContainsKey($key)) {
        return $script:CacheMetadata[$key]
    }

    Write-Host ''
    Write-Host ('PESQUISANDO: {0}' -f $key) -ForegroundColor Cyan

    $mb = Search-MusicBrainz -Artista $InfoArquivo.ArtistaBusca -Titulo $InfoArquivo.TituloBusca
    Write-Host ('MusicBrainz: {0}' -f $(if ($mb.resumo) { $mb.resumo } else { '(sem dados)' }))

    $dz = Search-Deezer -Artista $InfoArquivo.ArtistaBusca -Titulo $InfoArquivo.TituloBusca
    Write-Host ('Deezer: {0}' -f $(if ($dz.resumo) { $dz.resumo } else { '(sem dados)' }))

    $sp = Search-Spotify -Artista $InfoArquivo.ArtistaBusca -Titulo $InfoArquivo.TituloBusca
    Write-Host ('Spotify: {0}' -f $(if ($sp.resumo) { $sp.resumo } else { '(sem dados / sem credenciais)' }))

    $lf = Search-LastFm -Artista $InfoArquivo.ArtistaBusca -Titulo $InfoArquivo.TituloBusca
    Write-Host ('Last.fm: {0}' -f $(if ($lf.resumo) { $lf.resumo } else { '(sem dados / sem chave)' }))

    $meta = @{
        musicbrainz = $mb
        deezer      = $dz
        spotify     = $sp
        lastfm      = $lf
        artista     = $InfoArquivo.Artista
        titulo      = $InfoArquivo.Titulo
        versao      = $InfoArquivo.Versao
    }
    $script:CacheMetadata[$key] = $meta
    $script:Stats.Pesquisados++
    Save-MetadataCache
    return $meta
}

function Get-GeneroConsolidado {
    param($Meta)
    $parts = @()
    if ($Meta.musicbrainz -and $Meta.musicbrainz.resumo) { $parts += [string]$Meta.musicbrainz.resumo }
    if ($Meta.deezer -and $Meta.deezer.genero) { $parts += [string]$Meta.deezer.genero }
    if ($Meta.spotify -and $Meta.spotify.resumo) { $parts += [string]$Meta.spotify.resumo }
    if ($Meta.lastfm -and $Meta.lastfm.resumo) { $parts += [string]$Meta.lastfm.resumo }
    return (($parts | Where-Object { $_ }) -join ' | ')
}

# ============================================================
# OPENROUTER / IA
# ============================================================

function Get-OpenRouterModel {
    if (-not [string]::IsNullOrWhiteSpace($env:OPENROUTER_MODEL)) {
        return $env:OPENROUTER_MODEL
    }
    return $OPENROUTER_MODEL_PADRAO
}

function Get-ClassificacaoIA {
    param(
        [Parameter(Mandatory = $true)]
        [array]$Itens
    )
    $apiKey = $env:OPENROUTER_API_KEY
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        Write-BrsLog 'OPENROUTER_API_KEY nao definida. Pulando classificacao IA.' 'ERROR'
        return @()
    }
    if ($Itens.Count -eq 0) { return @() }

    $listaEstilos = ($ESTILOS_PERMITIDOS -join "`n")
    $blocos = New-Object System.Collections.Generic.List[string]
    $i = 0
    foreach ($item in $Itens) {
        $i++
        $meta = $item.Meta
        $info = $item.Info
        $bloco = @"
[$i]
Arquivo: $($info.Arquivo)
Artista: $($info.Artista)
Titulo: $($info.Titulo)
Versao: $($info.Versao)
MusicBrainz: $(if ($meta.musicbrainz.resumo) { $meta.musicbrainz.resumo } else { '-' })
Deezer: $(if ($meta.deezer.resumo) { $meta.deezer.resumo } else { '-' })
Spotify: $(if ($meta.spotify.resumo) { $meta.spotify.resumo } else { '-' })
Last.fm: $(if ($meta.lastfm.resumo) { $meta.lastfm.resumo } else { '-' })
"@
        $blocos.Add($bloco)
    }

    $systemPrompt = @"
Voce e um classificador de generos musicais da BRS - Brazilian Remix Service.
Responda SOMENTE com JSON valido (array). Sem Markdown. Sem cercas ```. Sem texto extra.
Cada item: {"arquivo":"...","estilo":"...","confianca":0.0}
Escolha SOMENTE UMA categoria da lista permitida.
Priorize o estilo da VERSAO especifica (remix/edit), nao apenas o historico do artista.
confianca deve ser numero entre 0 e 1.
Se incerto, use NAO CLASSIFICADO com confianca baixa.

CATEGORIAS PERMITIDAS:
$listaEstilos
"@

    $userPrompt = "Classifique as faixas abaixo.`n`n" + ($blocos -join "`n`n")

    $bodyObj = @{
        model    = (Get-OpenRouterModel)
        messages = @(
            @{ role = 'system'; content = $systemPrompt }
            @{ role = 'user'; content = $userPrompt }
        )
        temperature = 0.1
    }
    $bodyJson = $bodyObj | ConvertTo-Json -Depth 8

    $headers = @{
        Authorization = 'Bearer ' + $apiKey
        'Content-Type' = 'application/json'
        'HTTP-Referer' = 'https://brazilianremixservice.com'
        'X-Title' = 'BRS Music Organizer'
    }

    try {
        $script:Stats.ChamadasOpenRouter++
        $resp = Invoke-WithRetry -Operacao 'OpenRouter' -ScriptBlock {
            Invoke-RestMethod -Uri 'https://openrouter.ai/api/v1/chat/completions' -Method Post -Headers $headers -Body $bodyJson -TimeoutSec 120
        }
        $content = $null
        if ($resp.choices -and $resp.choices[0].message) {
            $content = [string]$resp.choices[0].message.content
        }
        if (-not $content) {
            Write-BrsLog 'OpenRouter retornou conteudo vazio.' 'WARN'
            return @()
        }

        $parsed = ConvertFrom-BrsJsonSafe $content
        if ($null -eq $parsed) { return @() }

        $lista = @()
        if ($parsed -is [System.Collections.IEnumerable] -and -not ($parsed -is [string])) {
            $lista = @($parsed)
        } else {
            $lista = @($parsed)
        }

        $saida = @()
        foreach ($row in $lista) {
            $arq = [string]$row.arquivo
            $estilo = [string]$row.estilo
            $conf = 0.0
            try { $conf = [double]$row.confianca } catch { $conf = 0.0 }

            $estiloNorm = $estilo.Trim().ToUpperInvariant()
            # Normalizar acentos comuns da IA
            if ($estiloNorm -eq 'FORRO & PISEIRO') { $estiloNorm = $script:EstiloForro }
            if ($estiloNorm -eq ('AXE & PAGODAO')) { $estiloNorm = $script:EstiloAxe }

            $match = $null
            foreach ($e in $ESTILOS_PERMITIDOS) {
                if ($e.ToUpperInvariant() -eq $estiloNorm.ToUpperInvariant()) {
                    $match = $e
                    break
                }
                # Comparacao sem acento
                $a = ($e.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}', '').ToUpperInvariant()
                $b = ($estiloNorm.Normalize([Text.NormalizationForm]::FormD) -replace '\p{M}', '').ToUpperInvariant()
                if ($a -eq $b) { $match = $e; break }
            }
            if (-not $match) { $match = 'NAO CLASSIFICADO'; $conf = [Math]::Min($conf, 0.4) }

            if ($conf -lt $CONFIANCA_MINIMA) {
                $match = 'NAO CLASSIFICADO'
            }

            $saida += [pscustomobject]@{
                arquivo   = $arq
                estilo    = $match
                confianca = $conf
            }

            Write-Host ('CLASSIFICADO: {0}' -f $match) -ForegroundColor Green
            Write-Host ('CONFIANCA: {0:P0}' -f $conf)
        }
        return $saida
    } catch {
        Write-BrsLog ("OpenRouter falhou: {0}" -f $_.Exception.Message) 'ERROR'
        $script:Stats.Erros++
        return @()
    }
}

# ============================================================
# PASTAS / MOVE
# ============================================================

function Get-OrCreateGenreFolder {
    param([string]$Estilo)
    $dest = Join-Path $script:Raiz $Estilo
    if (-not (Test-Path -LiteralPath $dest)) {
        if ($MODO_TESTE) {
            Write-BrsLog ("[TESTE] Criaria pasta: {0}" -f $dest)
        } else {
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
            $script:Stats.PastasCriadas++
            Write-BrsLog ("Pasta criada: {0}" -f $dest)
        }
    }
    return $dest
}

function Move-MusicFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Origem,
        [Parameter(Mandatory = $true)]
        [string]$Estilo,
        [string]$NomeArquivo
    )
    if ([string]::IsNullOrWhiteSpace($NomeArquivo)) {
        $NomeArquivo = [System.IO.Path]::GetFileName($Origem)
    }
    $pasta = Get-OrCreateGenreFolder -Estilo $Estilo
    $destino = Join-Path $pasta $NomeArquivo

    if (-not (Test-Path -LiteralPath $Origem)) {
        Write-BrsLog ("Origem inexistente: {0}" -f $Origem) 'ERROR'
        $script:Stats.Erros++
        return [pscustomobject]@{ Status = 'ERRO'; Destino = $destino }
    }

    # Ja esta no destino correto
    try {
        $origemFull = [System.IO.Path]::GetFullPath($Origem)
        $destinoFull = [System.IO.Path]::GetFullPath($destino)
        if ($origemFull.Equals($destinoFull, [StringComparison]::OrdinalIgnoreCase)) {
            return [pscustomobject]@{ Status = 'CACHE'; Destino = $destino }
        }
    } catch { }

    if (Test-Path -LiteralPath $destino) {
        Write-Host ('JA EXISTE -> {0}' -f $NomeArquivo) -ForegroundColor Yellow
        Write-BrsLog ("JA EXISTE (nao sobrescrever): {0}" -f $destino) 'WARN'
        $script:Stats.JaExistentes++
        return [pscustomobject]@{ Status = 'JA EXISTE'; Destino = $destino }
    }

    if ($MODO_TESTE) {
        Write-Host ('[{0}] {1}' -f $Estilo, $NomeArquivo) -ForegroundColor Magenta
        Write-Host ('  Destino planejado: {0}' -f $destino)
        Write-BrsLog ("[TESTE] Moveria '{0}' -> '{1}'" -f $Origem, $destino)
        $script:Stats.Simulados++
        return [pscustomobject]@{ Status = 'SIMULADO'; Destino = $destino }
    }

    try {
        Move-Item -LiteralPath $Origem -Destination $destino -ErrorAction Stop
        if (-not (Test-Path -LiteralPath $destino)) {
            Write-BrsLog ("Move falhou (destino ausente): {0}" -f $destino) 'ERROR'
            $script:Stats.Erros++
            return [pscustomobject]@{ Status = 'ERRO'; Destino = $destino }
        }
        if (Test-Path -LiteralPath $Origem) {
            Write-BrsLog ("Move suspeito (origem ainda existe): {0}" -f $Origem) 'WARN'
        }
        Write-BrsLog ("MOVIDO: '{0}' -> '{1}'" -f $Origem, $destino)
        $script:Stats.Movidos++
        return [pscustomobject]@{ Status = 'MOVIDO'; Destino = $destino }
    } catch {
        Write-BrsLog ("Erro ao mover '{0}': {1}" -f $Origem, $_.Exception.Message) 'ERROR'
        $script:Stats.Erros++
        return [pscustomobject]@{ Status = 'ERRO'; Destino = $destino }
    }
}

function Add-BrsReportRow {
    param(
        [string]$Arquivo,
        [string]$CaminhoOriginal,
        [string]$Artista,
        [string]$Titulo,
        [string]$Versao,
        [string]$MusicBrainz,
        [string]$Deezer,
        [string]$Spotify,
        [string]$LastFm,
        [string]$GeneroEncontrado,
        [string]$EstiloFinal,
        [string]$Confianca,
        [string]$Destino,
        [string]$Status
    )
    $script:RelatorioLinhas.Add([pscustomobject]@{
        Arquivo           = $Arquivo
        CaminhoOriginal   = $CaminhoOriginal
        Artista           = $Artista
        Titulo            = $Titulo
        Versao            = $Versao
        MusicBrainz       = $MusicBrainz
        Deezer            = $Deezer
        Spotify           = $Spotify
        LastFm            = $LastFm
        GeneroEncontrado  = $GeneroEncontrado
        EstiloFinal       = $EstiloFinal
        Confianca         = $Confianca
        Destino           = $Destino
        Status            = $Status
    }) | Out-Null
}

function Export-BrsReport {
    try {
        if ($script:RelatorioLinhas.Count -eq 0) {
            Write-BrsLog 'Relatorio CSV vazio.'
            return
        }
        $script:RelatorioLinhas | Export-Csv -LiteralPath $script:CsvPath -NoTypeInformation -Encoding UTF8
        Write-BrsLog ("Relatorio CSV salvo: {0}" -f $script:CsvPath)
    } catch {
        Write-BrsLog ("Falha ao exportar CSV: {0}" -f $_.Exception.Message) 'ERROR'
    }
}

# ============================================================
# PROCESSAMENTO PRINCIPAL
# ============================================================

function Invoke-BrsOrganizer {
    $inicio = Get-Date
    Write-BrsBanner 'BRS - ORGANIZADOR AUTOMATICO POR ESTILO'
    Write-Host ''
    Write-Host ('Raiz: {0}' -f $script:Raiz)
    Write-Host ('Modo: {0}' -f $(if ($MODO_TESTE) { 'TESTE (nao move arquivos)' } else { 'PRODUCAO (move arquivos)' }))
    Write-Host ('Lote IA: {0}' -f $TAMANHO_LOTE)
    Write-Host ('Confianca minima: {0}' -f $CONFIANCA_MINIMA)
    Write-Host ''

    Write-BrsLog ('Inicio. Raiz={0} ModoTeste={1}' -f $script:Raiz, $MODO_TESTE)

    Load-ClassificationCache
    Load-MetadataCache

    $musicas = Get-Musicas
    Write-Host ''
    Write-Host ('Pastas encontradas: {0:N0}' -f $script:Stats.PastasAnalisadas)
    Write-Host ('Arquivos de musica: {0:N0}' -f $musicas.Count)
    Write-Host ''
    Write-Host ('Cache: {0:N0} ja classificados' -f $script:CacheClassificacao.Count)

    $temOpenRouter = -not [string]::IsNullOrWhiteSpace($env:OPENROUTER_API_KEY)
    if (-not $temOpenRouter) {
        Write-Host ''
        Write-Host 'AVISO: OPENROUTER_API_KEY nao definida.' -ForegroundColor Yellow
        Write-Host 'Somente arquivos ja presentes no cache serao processados para organizacao.' -ForegroundColor Yellow
        Write-BrsLog 'OPENROUTER_API_KEY ausente.' 'WARN'
    }

    $pendentes = New-Object System.Collections.Generic.List[object]
    $doCache = New-Object System.Collections.Generic.List[object]

    foreach ($m in $musicas) {
        $info = Get-InfoArquivo -NomeArquivo $m.Name
        if ($script:CacheClassificacao.ContainsKey($m.Name)) {
            $doCache.Add([pscustomobject]@{ Musica = $m; Info = $info; Cache = $script:CacheClassificacao[$m.Name] }) | Out-Null
            $script:Stats.JaNoCache++
        } else {
            $pendentes.Add([pscustomobject]@{ Musica = $m; Info = $info }) | Out-Null
        }
    }

    Write-Host ('Precisam pesquisar/classificar: {0:N0}' -f $pendentes.Count)
    Write-BrsBanner 'PROCESSAMENTO'

    # --- Processar cache primeiro (sem rede/IA) ---
    foreach ($item in $doCache) {
        $estilo = [string]$item.Cache.estilo
        $conf = [double]$item.Cache.confianca
        $meta = $null
        if ($script:CacheMetadata.ContainsKey($item.Musica.Name)) {
            $meta = $script:CacheMetadata[$item.Musica.Name]
        }

        if ($estilo -eq 'NAO CLASSIFICADO' -and -not $MOVER_NAO_CLASSIFICADOS) {
            $script:Stats.NaoClassificados++
            Add-BrsReportRow -Arquivo $item.Musica.Name -CaminhoOriginal $item.Musica.FullName `
                -Artista $item.Info.Artista -Titulo $item.Info.Titulo -Versao $item.Info.Versao `
                -MusicBrainz $(if ($meta) { $meta.musicbrainz.resumo } else { '' }) `
                -Deezer $(if ($meta) { $meta.deezer.resumo } else { '' }) `
                -Spotify $(if ($meta) { $meta.spotify.resumo } else { '' }) `
                -LastFm $(if ($meta) { $meta.lastfm.resumo } else { '' }) `
                -GeneroEncontrado $(if ($meta) { Get-GeneroConsolidado $meta } else { '' }) `
                -EstiloFinal $estilo -Confianca ("{0:N2}" -f $conf) -Destino '' -Status 'NAO CLASSIFICADO'
            continue
        }

        $move = Move-MusicFile -Origem $item.Musica.FullName -Estilo $estilo -NomeArquivo $item.Musica.Name
        Add-BrsReportRow -Arquivo $item.Musica.Name -CaminhoOriginal $item.Musica.FullName `
            -Artista $item.Info.Artista -Titulo $item.Info.Titulo -Versao $item.Info.Versao `
            -MusicBrainz $(if ($meta) { $meta.musicbrainz.resumo } else { '' }) `
            -Deezer $(if ($meta) { $meta.deezer.resumo } else { '' }) `
            -Spotify $(if ($meta) { $meta.spotify.resumo } else { '' }) `
            -LastFm $(if ($meta) { $meta.lastfm.resumo } else { '' }) `
            -GeneroEncontrado $(if ($meta) { Get-GeneroConsolidado $meta } else { '' }) `
            -EstiloFinal $estilo -Confianca ("{0:N2}" -f $conf) -Destino $move.Destino -Status $(if ($move.Status -eq 'SIMULADO' -or $move.Status -eq 'MOVIDO' -or $move.Status -eq 'JA EXISTE') { if ($move.Status -eq 'CACHE') { 'CACHE' } else { $move.Status } } else { $move.Status })
        # Marcar status CACHE quando veio do cache e ja estava no lugar / simulado
        if ($move.Status -eq 'CACHE') {
            # ja no destino
        }
    }

    # --- Novos: pesquisa + IA em lotes ---
    if ($pendentes.Count -gt 0 -and -not $temOpenRouter) {
        Write-BrsLog ("Sem OPENROUTER_API_KEY — {0} arquivos nao serao classificados agora." -f $pendentes.Count) 'WARN'
        foreach ($p in $pendentes) {
            Add-BrsReportRow -Arquivo $p.Musica.Name -CaminhoOriginal $p.Musica.FullName `
                -Artista $p.Info.Artista -Titulo $p.Info.Titulo -Versao $p.Info.Versao `
                -MusicBrainz '' -Deezer '' -Spotify '' -LastFm '' -GeneroEncontrado '' `
                -EstiloFinal 'NAO CLASSIFICADO' -Confianca '0' -Destino '' -Status 'ERRO'
            $script:Stats.NaoClassificados++
        }
    } elseif ($pendentes.Count -gt 0) {
        $totalLotes = [Math]::Ceiling($pendentes.Count / [double]$TAMANHO_LOTE)
        $loteNum = 0
        for ($offset = 0; $offset -lt $pendentes.Count; $offset += $TAMANHO_LOTE) {
            $loteNum++
            $fim = [Math]::Min($offset + $TAMANHO_LOTE - 1, $pendentes.Count - 1)
            $slice = @($pendentes[$offset..$fim])
            Write-Host ''
            Write-Host ('LOTE {0}/{1} ({2} faixas)' -f $loteNum, $totalLotes, $slice.Count) -ForegroundColor Cyan
            Write-BrsLog ('Processando lote {0}/{1}' -f $loteNum, $totalLotes)

            $itensIA = New-Object System.Collections.Generic.List[object]
            foreach ($p in $slice) {
                try {
                    $meta = Get-OnlineMetadata -InfoArquivo $p.Info
                    $itensIA.Add([pscustomobject]@{
                        Musica = $p.Musica
                        Info   = $p.Info
                        Meta   = $meta
                    }) | Out-Null
                } catch {
                    Write-BrsLog ("Erro metadata '{0}': {1}" -f $p.Musica.Name, $_.Exception.Message) 'ERROR'
                    $script:Stats.Erros++
                    Add-BrsReportRow -Arquivo $p.Musica.Name -CaminhoOriginal $p.Musica.FullName `
                        -Artista $p.Info.Artista -Titulo $p.Info.Titulo -Versao $p.Info.Versao `
                        -MusicBrainz '' -Deezer '' -Spotify '' -LastFm '' -GeneroEncontrado '' `
                        -EstiloFinal 'NAO CLASSIFICADO' -Confianca '0' -Destino '' -Status 'ERRO'
                }
            }

            $classifs = @()
            try {
                $classifs = @(Get-ClassificacaoIA -Itens $itensIA)
            } catch {
                Write-BrsLog ("Lote IA falhou: {0}" -f $_.Exception.Message) 'ERROR'
                $script:Stats.Erros++
            }

            $map = @{}
            foreach ($c in $classifs) {
                if ($c.arquivo) { $map[$c.arquivo] = $c }
            }

            foreach ($it in $itensIA) {
                $nome = $it.Musica.Name
                $estilo = 'NAO CLASSIFICADO'
                $conf = 0.0
                if ($map.ContainsKey($nome)) {
                    $estilo = $map[$nome].estilo
                    $conf = [double]$map[$nome].confianca
                } else {
                    # Tentar match parcial por nome
                    foreach ($k in $map.Keys) {
                        if ($nome -like "*$k*" -or $k -like "*$nome*") {
                            $estilo = $map[$k].estilo
                            $conf = [double]$map[$k].confianca
                            break
                        }
                    }
                }

                $script:CacheClassificacao[$nome] = @{
                    estilo    = $estilo
                    confianca = $conf
                }
                $script:Stats.Classificados++

                $statusFinal = 'NAO CLASSIFICADO'
                $destino = ''
                if ($estilo -eq 'NAO CLASSIFICADO' -and -not $MOVER_NAO_CLASSIFICADOS) {
                    $script:Stats.NaoClassificados++
                    $statusFinal = 'NAO CLASSIFICADO'
                } else {
                    $move = Move-MusicFile -Origem $it.Musica.FullName -Estilo $estilo -NomeArquivo $nome
                    $destino = $move.Destino
                    $statusFinal = $move.Status
                    if ($estilo -eq 'NAO CLASSIFICADO') { $script:Stats.NaoClassificados++ }
                }

                Add-BrsReportRow -Arquivo $nome -CaminhoOriginal $it.Musica.FullName `
                    -Artista $it.Info.Artista -Titulo $it.Info.Titulo -Versao $it.Info.Versao `
                    -MusicBrainz $(if ($it.Meta.musicbrainz) { $it.Meta.musicbrainz.resumo } else { '' }) `
                    -Deezer $(if ($it.Meta.deezer) { $it.Meta.deezer.resumo } else { '' }) `
                    -Spotify $(if ($it.Meta.spotify) { $it.Meta.spotify.resumo } else { '' }) `
                    -LastFm $(if ($it.Meta.lastfm) { $it.Meta.lastfm.resumo } else { '' }) `
                    -GeneroEncontrado (Get-GeneroConsolidado $it.Meta) `
                    -EstiloFinal $estilo -Confianca ("{0:N2}" -f $conf) -Destino $destino -Status $statusFinal
            }

            Save-ClassificationCache
            Save-MetadataCache
            Write-BrsLog ('Lote {0} salvo no cache.' -f $loteNum)
        }
    }

    Export-BrsReport
    Save-ClassificationCache
    Save-MetadataCache

    $dur = (Get-Date) - $inicio
    Write-BrsBanner 'FINALIZADO'
    Write-Host ('Pastas analisadas:      {0}' -f $script:Stats.PastasAnalisadas)
    Write-Host ('Arquivos encontrados:   {0}' -f $script:Stats.ArquivosEncontrados)
    Write-Host ('Ja no cache:            {0}' -f $script:Stats.JaNoCache)
    Write-Host ('Pesquisados:            {0}' -f $script:Stats.Pesquisados)
    Write-Host ('Classificados:          {0}' -f $script:Stats.Classificados)
    Write-Host ('Nao classificados:      {0}' -f $script:Stats.NaoClassificados)
    Write-Host ('Movidos:                {0}' -f $script:Stats.Movidos)
    Write-Host ('Simulados:              {0}' -f $script:Stats.Simulados)
    Write-Host ('Ja existentes:          {0}' -f $script:Stats.JaExistentes)
    Write-Host ('Erros:                  {0}' -f $script:Stats.Erros)
    Write-Host ('Chamadas MusicBrainz:   {0}' -f $script:Stats.ChamadasMusicBrainz)
    Write-Host ('Chamadas Deezer:        {0}' -f $script:Stats.ChamadasDeezer)
    Write-Host ('Chamadas Spotify:       {0}' -f $script:Stats.ChamadasSpotify)
    Write-Host ('Chamadas Last.fm:       {0}' -f $script:Stats.ChamadasLastFm)
    Write-Host ('Chamadas OpenRouter:    {0}' -f $script:Stats.ChamadasOpenRouter)
    Write-Host ('Pastas criadas:         {0}' -f $script:Stats.PastasCriadas)
    Write-Host ('Tempo total:            {0}' -f $dur.ToString())
    Write-Host ''
    Write-Host ('Log: {0}' -f $script:LogPath)
    Write-Host ('CSV: {0}' -f $script:CsvPath)
    Write-Host ('Cache estilos: {0}' -f $script:CacheClassificacaoPath)
    Write-Host ('Cache metadata: {0}' -f $script:CacheMetadataPath)
    Write-BrsLog ('Fim. Duracao={0}' -f $dur.ToString())
}

# ============================================================
# ENTRY POINT
# ============================================================

try {
    Invoke-BrsOrganizer
} catch {
    Write-Host ('ERRO FATAL: {0}' -f $_.Exception.Message) -ForegroundColor Red
    try { Write-BrsLog ('ERRO FATAL: {0}' -f $_.Exception.Message) 'ERROR' } catch { }
    exit 1
}
