# ISA Link — Script de réinstallation propre
# Exécuter dans PowerShell en tant qu'administrateur (ou double-clic)
# Ce script supprime node_modules + package-lock.json et réinstalle tout proprement

Set-Location -Path "c:\xampp\ISA"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  ISA Link — Réinstallation propre pour Render    " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Supprimer node_modules
if (Test-Path "node_modules") {
    Write-Host "`n[1/4] Suppression de node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "      ✓ node_modules supprimé" -ForegroundColor Green
} else {
    Write-Host "`n[1/4] node_modules déjà absent — OK" -ForegroundColor Green
}

# 2. Supprimer l'ancien package-lock.json
if (Test-Path "package-lock.json") {
    Write-Host "[2/4] Suppression de package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force "package-lock.json"
    Write-Host "      ✓ package-lock.json supprimé" -ForegroundColor Green
} else {
    Write-Host "[2/4] package-lock.json déjà absent — OK" -ForegroundColor Green
}

# 3. Réinstaller proprement (sans sanitize-html)
Write-Host "[3/4] Installation des dépendances (npm install)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ npm install a échoué ! Voir les erreurs ci-dessus." -ForegroundColor Red
    Read-Host "Appuie sur Entrée pour quitter"
    exit 1
}
Write-Host "      ✓ npm install réussi" -ForegroundColor Green

# 4. Vérifier que parse-srcset est maintenant présent
Write-Host "[4/4] Vérification que parse-srcset est absent du package-lock..." -ForegroundColor Yellow
$lockContent = Get-Content "package-lock.json" -Raw
if ($lockContent -notmatch "parse-srcset") {
    Write-Host "      ✓ parse-srcset absent (normal — sanitize-html supprimé)" -ForegroundColor Green
} else {
    Write-Host "      ⚠ parse-srcset toujours présent — vérifier manuellement" -ForegroundColor DarkYellow
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "  ✓ Installation terminée ! Prochaine étape :     " -ForegroundColor Green
Write-Host "                                                  " -ForegroundColor Cyan
Write-Host "  git add -A                                      " -ForegroundColor White
Write-Host "  git commit -m 'fix: clean deps for Render'      " -ForegroundColor White
Write-Host "  git push                                        " -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan

Read-Host "`nAppuie sur Entrée pour quitter"
