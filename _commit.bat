@echo off
git add -A
git commit -m "feat: Warehouse planilha exata - Codigo, Descricao, Categoria, Consumivel, Qtd Atual, Qtd Minima, Unidade" -m "Colunas identicas a planilha enviada pelo usuario. Badges coloridos para Consumivel: verde para Nao, laranja para Sim. Linhas alternadas em azul-cinza. Pre-carregados 25 itens MAT-001 a MAT-025 com dados reais de EPI e Ferramenta. CSV template e parser atualizados para novo formato. Auto-geracao de codigo MAT-XXX no cadastro manual."
git push origin main
