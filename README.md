
# YSoffice - Enterprise Personal Management System

Sistema de gestão pessoal discreto e profissional, focado em produtividade e organização de dados.

## Tecnologias
- **Frontend**: React 19 (ESM)
- **Estilização**: Tailwind CSS
- **Backend**: Supabase (Auth & Database)
- **Ícones**: Lucide React

## Implantação (GitHub Pages)
1. Certifique-se de que todos os arquivos estão no diretório raiz do repositório.
2. Ative o GitHub Pages em `Settings > Pages`.
3. Selecione a branch `main` e a pasta `/` (root).
4. O site estará disponível em `https://<seu-usuario>.github.io/<nome-do-repo>/`.

## Segurança
- O sistema utiliza autenticação via Supabase.
- Chaves anônimas de publicação estão configuradas em `supabase.ts`.
- Políticas de Segurança de Linha (RLS) devem estar ativas no Supabase para garantir que usuários vejam apenas seus próprios dados.
