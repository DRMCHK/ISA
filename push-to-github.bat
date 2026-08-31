@echo off
cd /d "c:\xampp\htdocs\ISA"
echo === Git Remote ===
git remote get-url origin
echo.
echo === Git Status (before staging) ===
git status --short
echo.
echo === Staging all changes ===
git add -A
echo.
echo === Committing ===
git commit -m "fix: resolve Cannot find module @/lib/prisma on Render - use relative import in socket.ts"
echo.
echo === Pushing to GitHub ===
git push origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Pushed to GitHub! Render will auto-deploy.
    echo.
    echo GitHub: https://github.com/DRMCHK/ISA
) else (
    echo [ERROR] Push failed. Check authentication.
)
echo.
pause
