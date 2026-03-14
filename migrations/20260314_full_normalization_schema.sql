-- Migração Completa: Normalização Total do Banco de Dados YS-Manager

-- 1. Tabela de Perfil do Usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nick TEXT,
    photo_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kanban
CREATE TABLE IF NOT EXISTS public.kanban_columns (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    color TEXT,
    "order" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.kanban_cards (
    id TEXT PRIMARY KEY,
    column_id TEXT REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    labels TEXT[],
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Calendário
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    type TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notas e Post-its
CREATE TABLE IF NOT EXISTS public.important_notes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    category TEXT,
    priority TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_its (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT,
    color TEXT,
    rotation FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Financeiro
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT,
    amount DECIMAL(12,2),
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT,
    date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Logística
CREATE TABLE IF NOT EXISTS public.logistics_freight_tables (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    fuel_price DECIMAL(10,2),
    avg_consumption DECIMAL(10,2),
    driver_per_dieum DECIMAL(10,2),
    insurance_rate DECIMAL(5,2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Configurações Globais
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    calendar_config JSONB,
    hidden_tabs TEXT[],
    shift_config JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Emails
CREATE TABLE IF NOT EXISTS public.email_templates (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    category TEXT,
    subject TEXT,
    body TEXT,
    "to" TEXT,
    cc TEXT,
    saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Links Profissionais
CREATE TABLE IF NOT EXISTS public.professional_links (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    url TEXT,
    category TEXT,
    custom_icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Ramais / Extensões
CREATE TABLE IF NOT EXISTS public.extensions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    department TEXT,
    number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Assinaturas Digitais
CREATE TABLE IF NOT EXISTS public.signatures (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    data_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Arquivos Pessoais
CREATE TABLE IF NOT EXISTS public.personal_files (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    type TEXT,
    size INTEGER,
    data TEXT,
    category TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Fluxograma
CREATE TABLE IF NOT EXISTS public.flow_builder_states (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    payload JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Logística (Checklists e Rotas)
CREATE TABLE IF NOT EXISTS public.logistics_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    checklists JSONB,
    saved_routes JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Estoque (Warehouse)
CREATE TABLE IF NOT EXISTS public.warehouse_data (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    inventory JSONB,
    logs JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_its ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_freight_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_builder_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_data ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can only access their own profile" ON public.user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can only access their own kanban columns" ON public.kanban_columns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own kanban cards" ON public.kanban_cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own calendar events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own notes" ON public.important_notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own post-its" ON public.post_its FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own financial transactions" ON public.financial_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own logistics freight" ON public.logistics_freight_tables FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own emails" ON public.email_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own links" ON public.professional_links FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own extensions" ON public.extensions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own signatures" ON public.signatures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own files" ON public.personal_files FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own flow data" ON public.flow_builder_states FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own logistics data" ON public.logistics_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own warehouse data" ON public.warehouse_data FOR ALL USING (auth.uid() = user_id);
