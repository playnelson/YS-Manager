
import { createClient } from '@supabase/supabase-js';

// URL baseada no Project ID fornecido: zdpqikulmmogvkkqbnrg
const supabaseUrl = 'https://zdpqikulmmogvkkqbnrg.supabase.co';
// Chave Publishable fornecida: sb_publishable_znpp5qgfQVocl8yzDLqpGA_HVWbjnyA
const supabaseKey = 'sb_publishable_znpp5qgfQVocl8yzDLqpGA_HVWbjnyA'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
