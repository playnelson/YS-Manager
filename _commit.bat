@echo off
git add -A
git commit -m "feat: warehouse shopping cart for bulk material exits" -m "- Added CartItem type and cart state" -m "- Implemented CartModal for reviewing and bulk processing exits" -m "- Added 'Adicionar ao Carrinho' button to inventory rows" -m "- Integrated cart icon with counter in the Warehouse header"
git push origin main
