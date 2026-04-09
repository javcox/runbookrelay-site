param(
  [string]$RemoteUrl = "https://github.com/javcox/runbookrelay-site.git",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

$git = "C:\Program Files\Git\cmd\git.exe"
if (-not (Test-Path $git)) {
  throw "Git not found at $git"
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $repoRoot

try {
  if (-not (Test-Path (Join-Path $repoRoot ".git"))) {
    & $git init
    & $git branch -M $Branch
  }

  & $git add .
  & $git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    & $git commit -m "Initial Runbook Relay site" 2>$null
  }

  $existingRemote = & $git remote 2>$null
  if ($existingRemote -notcontains "origin") {
    & $git remote add origin $RemoteUrl
  }

  & $git push -u origin $Branch
}
finally {
  Pop-Location
}
