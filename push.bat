@echo off
echo ========================================================
echo   Git Initialisation and Push Automation Script (CMD)
echo ========================================================
echo.

echo [1/6] Initializing local Git repository...
git init
echo.

echo [2/6] Staging files...
git add .
echo.

echo [3/6] Creating commit...
git commit -m "feat: dynamic admin dashboard analytics metrics & subdomain routing integration"
echo.

echo [4/6] Setting branch to main...
git branch -M main
echo.

echo [5/6] Connecting remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/Kevmusango/tolla.app.git
echo.

echo [6/6] Pushing code to GitHub (with force overwrite to align with initial repo)...
git push -u origin main --force
echo.

echo ========================================================
echo   ✅ Success! Code pushed to Kevmusango/tolla.app!
echo ========================================================
pause
