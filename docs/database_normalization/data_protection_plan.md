# Plano de Proteção de Dados (Data Protection Plan)

Este documento descreve as medidas de segurança e conformidade para o YS-Manager, garantindo a proteção dos dados dos usuários em conformidade com a LGPD (Lei Geral de Proteção de Dados).

## 1. Controle de Acesso e Identidade
- **Autenticação**: Utilização exclusiva do Supabase Auth para gestão de identidades.
- **Autorização (RLS)**: Implementação de Row Level Security (RLS) em todas as tabelas, garantindo que usuários possuam acesso estritamente aos seus próprios dados.
- **Sessões**: Tokens JWT de curta duração com refresh automático.

## 2. Segurança dos Dados
- **Criptografia em Trânsito**: Todo o tráfego é protegido via TLS/SSL.
- **Criptografia em Repouso**: Dados armazenados no banco de dados Supabase são criptografados pelo provedor (AWS/GCP via Supabase).
- **Dados Sensíveis**: Informações financeiras e arquivos pessoais serão avaliados para criptografia adicional em nível de aplicação (Postgres Vault) se necessário.

## 3. Conformidade LGPD
- **Minimização de Dados**: Coleta apenas das informações necessárias para o funcionamento dos módulos.
- **Direito ao Acesso**: Interface de visualização clara de todos os dados do usuário.
- **Direito ao Esquecimento**: Funcionalidade de exclusão de conta que remove em cascata todos os dados vinculados ao `user_id`.
- **Transparência**: Este plano servirá como base para os Termos de Uso e Política de Privacidade.

## 4. Gestão de Incidentes e Backup
- **Backups**: Utilização dos backups automáticos do Supabase com retenção de 7 dias (ou conforme plano do usuário).
- **Recuperação**: Plano de Point-in-Time Recovery (PITR) para restauração em caso de corrupção de dados.
- **Logs**: Monitoramento de acesso via Supabase Logs para auditoria.
