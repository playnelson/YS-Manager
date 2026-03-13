@echo off
del _commit.bat
git add -A
git commit -m "chore: remove temp commit script"
git push origin main
