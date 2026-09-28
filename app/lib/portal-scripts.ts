import "server-only";

export type PortalAdminScript = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  language: "powershell";
  script: string;
};

/** This registry is served only by the authenticated, active-plan portal API. */
export const PORTAL_ADMIN_SCRIPTS: PortalAdminScript[] = [
  {
    id: "organizar-musicas-por-estilo",
    title: "Organizar músicas por estilo",
    description:
      "Lê o gênero/estilo gravado nas tags das músicas e reúne os arquivos em pastas por estilo na pasta em que o PowerShell foi aberto. A classificação é local e muito rápida: não envia os arquivos para a internet.",
    fileName: "organizar-musicas-por-estilo.ps1",
    language: "powershell",
    script: String.raw`# BRS - Organizar todos os áudios da pasta atual por estilo
$Raiz = (Get-Location).Path
$ErrorActionPreference = 'Stop'

$Extensoes = @(
    '.mp3', '.flac', '.wav', '.m4a', '.aac', '.wma',
    '.ogg', '.opus', '.aif', '.aiff', '.alac'
)

$Shell = New-Object -ComObject Shell.Application
$Cache = @{}
$Resumo = @{
    Encontrados = 0
    Movidos = 0
    JaOrganizados = 0
    Undefined = 0
    Renomeados = 0
    Erros = 0
}

function Normalizar([string]$Valor) {
    if ([string]::IsNullOrWhiteSpace($Valor)) { return '' }
    $Valor = $Valor.Normalize([Text.NormalizationForm]::FormD)
    return ([regex]::Replace($Valor, '\p{Mn}', '')).ToUpperInvariant()
}

function Identificar-Estilo([string]$Valor) {
    $v = Normalizar $Valor
    if (-not $v) { return $null }

    if ($v -match 'ELETRO[ -]?FUNK|MEGA[ -]?FUNK|\bMTG\b') { return 'ELETROFUNK E MTG' }
    if ($v -match 'FUNKY[ -]?HOUSE|NU[ -]?DISCO') { return 'DISCO HOUSE' }
    if ($v -match 'AFRO[ -]?HOUSE|AMAPIANO') { return 'AFRO HOUSE' }
    if ($v -match 'TECH[ -]?HOUSE') { return 'TECH HOUSE' }
    if ($v -match 'DEEP[ -]?HOUSE') { return 'DEEP HOUSE' }
    if ($v -match 'PROGRESSIVE[ -]?HOUSE') { return 'PROGRESSIVE HOUSE' }
    if ($v -match 'ORGANIC[ -]?HOUSE') { return 'ORGANIC HOUSE' }
    if ($v -match 'MELODIC[ -]?(HOUSE|TECHNO)') { return 'MELODIC HOUSE E TECHNO' }
    if ($v -match 'DRUM[ -]?(AND|N|&)[ -]?BASS|\bDNB\b|DRUM[ -]?BASS') { return 'DRUM AND BASS' }
    if ($v -match 'HIP[ -]?HOP|\bRAP\b|\bTRAP\b|\bR&B\b|\bRNB\b') { return 'HIP HOP E R&B' }
    if ($v -match 'REGGAETON|REGUETON|DEMBOW') { return 'REGGAETON' }
    if ($v -match 'SERTANEJ|MODAO|MODA DE VIOLA') { return 'SERTANEJO' }
    if ($v -match 'FORRO|PISEIRO|PISADINHA|XOTE') { return 'FORRO E PISEIRO' }
    if ($v -match 'BREGA|ARROCHA') { return 'BREGA E ARROCHA' }
    if ($v -match 'PAGODAO|\bAXE\b') { return 'AXE E PAGODAO' }
    if ($v -match 'PAGODE|SAMBA') { return 'PAGODE E SAMBA' }
    if ($v -match '\bFUNK\b|BAILE FUNK') { return 'FUNK' }
    if ($v -match 'COUNTRY|\bAGRO\b') { return 'COUNTRY' }
    if ($v -match 'SALSA|BACHATA|MERENGUE|CUMBIA|LATIN|LATINO') { return 'LATIN' }
    if ($v -match 'FREESTYLE|BOOGIE|DISCO') { return 'DISCO' }
    if ($v -match 'TECHNO') { return 'TECHNO' }
    if ($v -match 'TRANCE|PSYTRANCE') { return 'TRANCE' }
    if ($v -match 'DUBSTEP|BASS MUSIC|FUTURE BASS') { return 'BASS MUSIC' }
    if ($v -match 'ELECTRO[ -]?HOUSE|BIG[ -]?ROOM|\bEDM\b') { return 'EDM' }
    if ($v -match '\bHOUSE\b') { return 'HOUSE' }
    if ($v -match 'DANCE|EURODANCE|ELETRONIC|ELECTRONIC') { return 'DANCE' }
    if ($v -match 'AFROBEAT|AFROPOP') { return 'AFROBEATS' }
    if ($v -match '\bK[ -]?POP\b') { return 'K-POP' }
    if ($v -match '\bPOP\b') { return 'POP' }
    if ($v -match 'REGGAE|DANCEHALL') { return 'REGGAE E DANCEHALL' }
    if ($v -match '\bROCK\b|ALTERNATIVE|\bINDIE\b|\bMETAL\b') { return 'ROCK' }
    if ($v -match '\bSOUL\b|\bJAZZ\b|BLUES') { return 'SOUL E JAZZ' }
    if ($v -match 'GOSPEL|CHRISTIAN') { return 'GOSPEL' }

    return $null
}

function Ler-Genero($Arquivo) {
    try {
        $Dir = $Arquivo.DirectoryName

        if (-not $Cache.ContainsKey($Dir)) {
            $Cache[$Dir] = $Shell.Namespace($Dir)
        }

        if ($null -eq $Cache[$Dir]) { return '' }

        $ItemShell = $Cache[$Dir].ParseName($Arquivo.Name)
        if ($null -eq $ItemShell) { return '' }

        $Genero = $ItemShell.ExtendedProperty('System.Music.Genre')
        if ($null -eq $Genero) { return '' }

        return [string]::Join('; ', [string[]]@($Genero))
    }
    catch {
        return ''
    }
}

function Estilo-Da-Tag([string]$Genero) {
    if ([string]::IsNullOrWhiteSpace($Genero)) { return $null }

    foreach ($Parte in ($Genero -split '[/;,|]')) {
        $Estilo = Identificar-Estilo $Parte
        if ($Estilo) { return $Estilo }
    }

    $Primeiro = ($Genero -split '[/;,|]')[0].Trim().ToUpperInvariant()
    $Primeiro = [regex]::Replace($Primeiro, '[<>:"/\\|?*\x00-\x1F]', ' ')
    $Primeiro = [regex]::Replace($Primeiro, '\s+', ' ').Trim(' ', '.')

    if ($Primeiro.Length -gt 60) {
        $Primeiro = $Primeiro.Substring(0, 60).Trim()
    }

    if ($Primeiro -and $Primeiro -notmatch '^(UNKNOWN|UNDEFINED|OTHER|OUTROS?|DESCONHECIDO)$') {
        return $Primeiro
    }

    return $null
}

# A lista é coletada antes de mover qualquer arquivo.
$Arquivos = @(
    Get-ChildItem -LiteralPath $Raiz -File -Recurse -Force |
        Where-Object {
            ($Extensoes -contains $_.Extension.ToLowerInvariant()) -and
            -not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint)
        }
)

Write-Host "Pasta atual: $Raiz"
Write-Host "Áudios encontrados: $($Arquivos.Count)"

foreach ($Arquivo in $Arquivos) {
    $Resumo.Encontrados++

    try {
        # Primeiro: tag de gênero.
        $Estilo = Estilo-Da-Tag (Ler-Genero $Arquivo)

        # Depois: nomes das subpastas, da mais próxima para a mais distante.
        if (-not $Estilo) {
            $Diretorio = $Arquivo.Directory

            while ($null -ne $Diretorio -and
                   $Diretorio.FullName.Length -gt $Raiz.Length) {
                $Estilo = Identificar-Estilo $Diretorio.Name
                if ($Estilo) { break }
                $Diretorio = $Diretorio.Parent
            }
        }

        # Depois: nome do arquivo.
        if (-not $Estilo) {
            $Estilo = Identificar-Estilo $Arquivo.BaseName
        }

        # Por último: nome da própria pasta atual.
        if (-not $Estilo) {
            $Estilo = Identificar-Estilo (Split-Path $Raiz -Leaf)
        }

        if (-not $Estilo) {
            $Estilo = 'UNDEFINED'
            $Resumo.Undefined++
        }

        $PastaDestino = Join-Path $Raiz $Estilo

        # Se já estiver diretamente na pasta correta, não move.
        if ($Arquivo.DirectoryName -ieq $PastaDestino) {
            $Resumo.JaOrganizados++
            continue
        }

        if (-not (Test-Path -LiteralPath $PastaDestino -PathType Container)) {
            New-Item -ItemType Directory -Path $PastaDestino -Force |
                Out-Null
        }

        $Destino = Join-Path $PastaDestino $Arquivo.Name
        $Numero = 2

        while (Test-Path -LiteralPath $Destino) {
            $NovoNome = '{0} ({1}){2}' -f
                $Arquivo.BaseName, $Numero, $Arquivo.Extension

            $Destino = Join-Path $PastaDestino $NovoNome
            $Numero++
            $Resumo.Renomeados++
        }

        Move-Item -LiteralPath $Arquivo.FullName -Destination $Destino -ErrorAction Stop
        $Resumo.Movidos++

        Write-Host "MOVIDO [$Estilo]: $($Arquivo.Name)"
    }
    catch {
        $Resumo.Erros++
        Write-Warning "Erro em $($Arquivo.FullName): $($_.Exception.Message)"
    }
}

Write-Host "` + "`" + String.raw`nConcluído."
Write-Host "Encontrados: $($Resumo.Encontrados) | Movidos: $($Resumo.Movidos)"
Write-Host "Já organizados: $($Resumo.JaOrganizados) | UNDEFINED: $($Resumo.Undefined)"
Write-Host "Nomes repetidos ajustados: $($Resumo.Renomeados) | Erros: $($Resumo.Erros)"`,
  },
  {
    id: "reunir-musicas-na-pasta-atual",
    title: "Reunir músicas na pasta atual",
    description:
      "Reúne na pasta em que o PowerShell foi aberto todas as músicas encontradas nas subpastas, mesmo em níveis profundos. Mantém intactos os arquivos que já estão na raiz, evita sobrescrever nomes repetidos e remove as subpastas que ficarem vazias.",
    fileName: "reunir-musicas-na-pasta-atual.ps1",
    language: "powershell",
    script: String.raw`# BRS - Reunir músicas na pasta atual
$Raiz = (Get-Location).Path
$ErrorActionPreference = 'Stop'

$Extensoes = @(
    '.mp3', '.flac', '.wav', '.m4a', '.aac', '.wma',
    '.ogg', '.opus', '.aif', '.aiff', '.alac'
)

$Pastas = New-Object 'System.Collections.Generic.List[string]'
$Musicas = New-Object 'System.Collections.Generic.List[System.IO.FileInfo]'
$Pilha = New-Object 'System.Collections.Generic.Stack[string]'
$Pilha.Push($Raiz)

# Percorre todos os níveis sem entrar em atalhos ou links de pastas.
while ($Pilha.Count -gt 0) {
    $Atual = $Pilha.Pop()

    try {
        $Itens = @(Get-ChildItem -LiteralPath $Atual -Force -ErrorAction Stop)
    }
    catch {
        Write-Warning "Não foi possível ler $Atual : $($_.Exception.Message)"
        continue
    }

    foreach ($Item in $Itens) {
        if ($Item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            continue
        }

        if ($Item.PSIsContainer) {
            $Pastas.Add($Item.FullName)
            $Pilha.Push($Item.FullName)
        }
        elseif (
            $Item.DirectoryName -ine $Raiz -and
            $Extensoes -contains $Item.Extension.ToLowerInvariant()
        ) {
            $Musicas.Add($Item)
        }
    }
}

$Movidas = 0
$Renomeadas = 0
$Erros = 0
$PastasRemovidas = 0

Write-Host "Pasta raiz: $Raiz"
Write-Host "Músicas encontradas nas subpastas: $($Musicas.Count)"
Write-Host ""

foreach ($Musica in $Musicas) {
    try {
        $Destino = Join-Path $Raiz $Musica.Name
        $Numero = 2
        $NomeAlterado = $false

        while (Test-Path -LiteralPath $Destino) {
            $NomeNovo = '{0} ({1}){2}' -f
                $Musica.BaseName, $Numero, $Musica.Extension

            $Destino = Join-Path $Raiz $NomeNovo
            $Numero++
            $NomeAlterado = $true
        }

        Move-Item §
            -LiteralPath $Musica.FullName §
            -Destination $Destino §
            -ErrorAction Stop

        $Movidas++

        if ($NomeAlterado) {
            $Renomeadas++
        }

        Write-Host "MOVIDA: $($Musica.FullName) -> $Destino"
    }
    catch {
        $Erros++
        Write-Warning "Erro ao mover $($Musica.FullName): $($_.Exception.Message)"
    }
}

# Começa pelas pastas mais profundas, para remover também as pastas
# que ficarem vazias depois da remoção das pastas internas.
foreach ($Pasta in ($Pastas | Sort-Object Length -Descending)) {
    try {
        if (-not (Test-Path -LiteralPath $Pasta -PathType Container)) {
            continue
        }

        $Conteudo = Get-ChildItem -LiteralPath $Pasta -Force -ErrorAction Stop |
            Select-Object -First 1

        if ($null -eq $Conteudo) {
            Remove-Item -LiteralPath $Pasta -Force -ErrorAction Stop
            $PastasRemovidas++
            Write-Host "PASTA VAZIA REMOVIDA: $Pasta"
        }
    }
    catch {
        $Erros++
        Write-Warning "Erro ao verificar $Pasta : $($_.Exception.Message)"
    }
}

Write-Host "§nConcluído."
Write-Host "Músicas movidas: $Movidas"
Write-Host "Nomes repetidos ajustados: $Renomeadas"
Write-Host "Pastas vazias removidas: $PastasRemovidas"
Write-Host "Erros: $Erros"`.replaceAll("§", "`"),
  },
];
