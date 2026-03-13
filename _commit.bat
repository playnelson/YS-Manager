@echo off
git add -A
git commit -m "feat: Warehouse XLSX import support" -m "- Installed 'xlsx' library" -m "- Added parseXLSX helper to extract data from Excel sheets" -m "- Updated handleFileUpload to support .csv, .xls, and .xlsx" -m "- Mapped columns to 'Código', 'Descrição', 'Categoria', 'Consumível?', 'Qtd. Atual', 'Qtd. Mínima', 'Unidade'" -m "- Updated UI button text to 'Importar Planilha'"
git push origin main
