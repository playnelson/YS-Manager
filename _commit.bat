@echo off
git add -A
git commit -m "feat: item return functionality for employees" -m "- Added 'Devolver' button to employee possession list" -m "- Implemented handleReturnItem logic to transfer items back to stock" -m "- Automatic 'entry' log generation for returned materials"
git push origin main
