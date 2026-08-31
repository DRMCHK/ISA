# ============================================================
# ISA Link — Push to GitHub for Render Deployment
# ============================================================

param(
    [string]$CommitMessage = "chore: configure project for Render deployment"
)

$ErrorActionPreference = "Stop"
$RepoPath = "c:\xampp\htdocs\ISA"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   ISA Link — GitHub Push for Render Deploy   ║" -ForegroundColor Cyan
Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Set-Location $RepoPath

# Check git remote
Write-Host "[1/5] Verifying git remote..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
Write-Host "  Remote: $remote" -ForegroundColor Green

# Show current status
Write-Host ""
Write-Host "[2/5] Current git status:" -ForegroundColor Yellow
git status --short

# Stage all changes
Write-Host ""
Write-Host "[3/5] Staging all changes..." -ForegroundColor Yellow
git add -A
Write-Host "  All changes staged." -ForegroundColor Green

# Commit
Write-Host ""
Write-Host "[4/5] Committing..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "$CommitMessage (${timestamp})" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Nothing new to commit, or commit failed." -ForegroundColor Magenta
}

# Push to GitHub
Write-Host ""
Write-Host "[5/5] Pushing to GitHub (origin/main)..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "  📦 Repo: https://github.com/DRMCHK/ISA" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  🚀 Next steps for Render:" -ForegroundColor Yellow
    Write-Host "     1. Go to https://dashboard.render.com" -ForegroundColor White
    Write-Host "     2. Connect GitHub repo: DRMCHK/ISA" -ForegroundColor White
    Write-Host "     3. Use 'render.yaml' (Blueprint) or configure manually" -ForegroundColor White
    Write-Host "     4. Set environment variables (CLOUDINARY, ADMIN_SEED, etc.)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  ❌ Push failed. Check authentication or conflicts." -ForegroundColor Red
    exit 1
}
