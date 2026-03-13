@echo off
git add -A
git commit -m "feat: live inventory export to Excel" -m "- Implemented exportInventory function using SheetJS" -m "- Added 'Exportar Planilha' button to generate formatted XLSX files" -m "- Refactored Warehouse module buttons for better layout" -m "- Updated icons for Template and Import buttons"
git push origin main
