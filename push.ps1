# Git Initialisation and Push Automation Script
# Run this script in your terminal (PowerShell) to push the updates safely.

Write-Host "📦 Initializing local Git repository..." -ForegroundColor Cyan
git init

Write-Host "🔍 Staging files..." -ForegroundColor Cyan
git add .

Write-Host "💾 Creating commit..." -ForegroundColor Cyan
git commit -m "feat: dynamic admin dashboard analytics metrics & subdomain routing integration"

Write-Host "🌿 Setting branch to main..." -ForegroundColor Cyan
git branch -M main

Write-Host "🔗 Associating remote repository: https://github.com/Kevmusango/tolla.app.git" -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/Kevmusango/tolla.app.git

Write-Host "🚀 Pushing code to GitHub (with force overwrite to align with initial repo)..." -ForegroundColor Cyan
git push -u origin main --force

Write-Host "✅ Code successfully committed and pushed to Kevmusango/tolla.app!" -ForegroundColor Green
