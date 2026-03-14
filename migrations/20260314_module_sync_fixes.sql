-- Migration: warehouse_and_whatsapp_tables
-- Description: Adds tables for Warehouse management and WhatsApp tools

-- 1. Table: warehouse_inventory
CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  unit TEXT NOT NULL,
  location TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: warehouse_employees
CREATE TABLE IF NOT EXISTS warehouse_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table: warehouse_logs
CREATE TABLE IF NOT EXISTS warehouse_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES warehouse_inventory(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'in' or 'out'
  quantity INTEGER NOT NULL,
  employee_name TEXT,
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: whatsapp_templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table: whatsapp_history
CREATE TABLE IF NOT EXISTS whatsapp_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  message TEXT,
  method TEXT, -- 'api', 'web', 'app'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can only access their own warehouse_inventory" ON warehouse_inventory FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own warehouse_employees" ON warehouse_employees FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own warehouse_logs" ON warehouse_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own whatsapp_templates" ON whatsapp_templates FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own whatsapp_history" ON whatsapp_history FOR ALL USING (auth.uid() = user_id);
