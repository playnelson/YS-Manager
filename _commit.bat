@echo off
git add -A
git commit -m "feat: use custom Excel file as warehouse template" -m "- Created public directory for static assets" -m "- Copied 'controle_estoque (1).xlsx' to 'public/planilha_estoque.xlsx'" -m "- Updated WarehouseModule.tsx to download the static XLSX file instead of generating a CSV"
git push origin main
