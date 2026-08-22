$ErrorActionPreference = "Stop"
$Repo = "https://github.com/davidUSboy/pocket-hell.git"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Work = Join-Path $env:TEMP ("pocket-hell-v2-" + [Guid]::NewGuid().ToString("N"))

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed or is not available in PATH."
}

Write-Host "[1/4] Cloning the current repository..." -ForegroundColor Cyan
git clone $Repo $Work
if ($LASTEXITCODE -ne 0) { throw "Git clone failed." }

Write-Host "[2/4] Copying Pocket Hell v2..." -ForegroundColor Cyan
$Excluded = @(".git", "publish-to-github.ps1", "publish-to-github.sh", "PUBLISH.md")
Get-ChildItem -LiteralPath $Root -Force | Where-Object { $Excluded -notcontains $_.Name } | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $Work -Recurse -Force
}

Write-Host "[3/4] Creating the release commit..." -ForegroundColor Cyan
git -C $Work add --all
$Changes = git -C $Work status --porcelain
if (-not $Changes) {
  Write-Host "Repository is already up to date." -ForegroundColor Green
  exit 0
}
git -C $Work commit -m "feat: launch premium Pocket Hell v2"
if ($LASTEXITCODE -ne 0) { throw "Git commit failed." }

Write-Host "[4/4] Pushing to GitHub..." -ForegroundColor Cyan
git -C $Work push origin main
if ($LASTEXITCODE -ne 0) { throw "Git push failed." }

Write-Host "Pocket Hell v2 has been pushed successfully." -ForegroundColor Green
Write-Host "Live site: https://davidusboy.github.io/pocket-hell/"
