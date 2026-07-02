$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputPath
)

function Import-EnvFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ($trimmed.Length -eq 0 -or $trimmed.StartsWith("#")) {
      continue
    }

    $separatorIndex = $trimmed.IndexOf("=")
    if ($separatorIndex -le 0) {
      continue
    }

    $name = $trimmed.Substring(0, $separatorIndex).Trim()
    $value = $trimmed.Substring($separatorIndex + 1).Trim()
    if (
      ($value.StartsWith('"') -and $value.EndsWith('"')) -or
      ($value.StartsWith("'") -and $value.EndsWith("'"))
    ) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    if (-not [string]::IsNullOrWhiteSpace($name)) {
      [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
  }
}

function Require-Env {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Missing required environment variable: $Name"
  }

  return $value
}

function Resolve-CodeSignTool {
  $configuredPath = [Environment]::GetEnvironmentVariable("SSL_COM_CODESIGNTOOL")
  if ([string]::IsNullOrWhiteSpace($configuredPath)) {
    throw "Missing required environment variable: SSL_COM_CODESIGNTOOL"
  }

  if (-not (Test-Path -LiteralPath $configuredPath)) {
    throw "SSL_COM_CODESIGNTOOL does not exist: $configuredPath"
  }

  $resolvedPath = (Resolve-Path -LiteralPath $configuredPath).Path
  $fileName = Split-Path -Leaf $resolvedPath
  if ($fileName -notin @("CodeSignTool.bat", "CodeSignTool.exe")) {
    throw "SSL_COM_CODESIGNTOOL must point to CodeSignTool.bat or CodeSignTool.exe: $resolvedPath"
  }

  return $resolvedPath
}

function Protect-CodeSignToolOutput {
  param(
    [AllowNull()]
    [object[]]$Output
  )

  if (-not $Output) {
    return @()
  }

  $secretsToRedact = @($username, $password, $credentialId, $totpSecret) |
    Where-Object { -not [string]::IsNullOrEmpty($_) }

  foreach ($line in $Output) {
    $redactedLine = [string]$line
    foreach ($secret in $secretsToRedact) {
      $redactedLine = $redactedLine.Replace($secret, "***")
    }

    $redactedLine
  }
}

function Resolve-SignTool {
  $pathCommand = Get-Command "signtool.exe" -ErrorAction SilentlyContinue
  if ($pathCommand) {
    return $pathCommand.Source
  }

  $windowsKitsRoot = Join-Path ${env:ProgramFiles(x86)} "Windows Kits\10\bin"
  if (-not (Test-Path -LiteralPath $windowsKitsRoot)) {
    return $null
  }

  $candidate = Get-ChildItem -LiteralPath $windowsKitsRoot -Recurse -File -Filter "signtool.exe" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*\x64\signtool.exe" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1

  return $candidate?.FullName
}

function Assert-CodeSignature {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  try {
    Import-Module Microsoft.PowerShell.Security -ErrorAction Stop
    $signature = Get-AuthenticodeSignature -LiteralPath $Path -ErrorAction Stop
    $signature | Format-List
    if ($signature.Status -eq "Valid") {
      return
    }

    Write-Warning "Get-AuthenticodeSignature returned $($signature.Status). Trying signtool.exe verification."
  } catch {
    Write-Warning "Get-AuthenticodeSignature is unavailable: $($_.Exception.Message)"
  }

  $signTool = Resolve-SignTool
  if ($signTool) {
    $global:LASTEXITCODE = 0
    & $signTool verify /pa /v $Path
    if ($LASTEXITCODE -eq 0) {
      return
    }

    throw "signtool.exe verification failed for: $Path"
  }

  Write-Warning "Could not verify signature because neither Get-AuthenticodeSignature nor signtool.exe is available."
}

if ($env:OS -ne "Windows_NT") {
  throw "Windows signing must run on Windows."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Import-EnvFile (Join-Path $repoRoot ".env")
Import-EnvFile (Join-Path $repoRoot ".env.local")

$resolvedInputPath = (Resolve-Path -LiteralPath $InputPath).Path
$codeSignTool = Resolve-CodeSignTool
$username = Require-Env "SSL_COM_USERNAME"
$password = Require-Env "SSL_COM_PASSWORD"
$credentialId = Require-Env "SSL_COM_CREDENTIAL_ID"
$totpSecret = Require-Env "SSL_COM_TOTP_SECRET"

$logRoot = [Environment]::GetEnvironmentVariable("TAURI_SIGNING_LOG_DIR")
if ([string]::IsNullOrWhiteSpace($logRoot)) {
  $logRoot = Join-Path ([System.IO.Path]::GetTempPath()) "noto-windows-signing"
}

$signingId = [System.IO.Path]::GetFileNameWithoutExtension([System.IO.Path]::GetRandomFileName())
$outputDirectory = Join-Path $logRoot $signingId
$logPath = Join-Path $outputDirectory "codesigntool.log"
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

Write-Host "Signing Windows artifact with SSL.com CodeSignTool"
Write-Host "Input: $resolvedInputPath"
Write-Host "Log: $logPath"

$global:LASTEXITCODE = 0
$codeSignToolDirectory = Split-Path -Parent $codeSignTool
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
Push-Location $codeSignToolDirectory
try {
  $output = & $codeSignTool sign `
    "-username=$username" `
    "-password=$password" `
    "-credential_id=$credentialId" `
    "-totp_secret=$totpSecret" `
    "-input_file_path=$resolvedInputPath" `
    "-output_dir_path=$outputDirectory" `
    '-override=true' 2>&1
  $exitCode = $LASTEXITCODE
} finally {
  Pop-Location
  $ErrorActionPreference = $previousErrorActionPreference
}

$redactedOutput = Protect-CodeSignToolOutput -Output $output
$redactedOutput | Set-Content -LiteralPath $logPath
$redactedOutput | ForEach-Object {
  Write-Host $_
}

if ($exitCode -ne 0) {
  throw "SSL.com CodeSignTool failed with exit code $exitCode. See log: $logPath"
}

$inputName = Split-Path -Leaf $resolvedInputPath
$exactOutput = Join-Path $outputDirectory $inputName
if (Test-Path -LiteralPath $exactOutput) {
  $signedOutput = $exactOutput
} else {
  $signedOutput = Get-ChildItem -LiteralPath $outputDirectory -Recurse -File |
    Where-Object { $_.FullName -ne $logPath } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if (-not $signedOutput) {
    throw "SSL.com did not produce a signed output file in $outputDirectory"
  }

  $signedOutput = $signedOutput.FullName
}

Copy-Item -LiteralPath $signedOutput -Destination $resolvedInputPath -Force
Assert-CodeSignature -Path $resolvedInputPath
Write-Host "Signed and verified: $resolvedInputPath"
