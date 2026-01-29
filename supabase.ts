
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdpqikulmmogvkkqbnrg.supabase.co';
// Use SUPABASE_KEY if available, fallback to API_KEY which is standard in this environment.
// Provide a placeholder 'none' to satisfy the SDK's internal check and prevent a crash.
const supabaseKey = (process.env as any).SUPABASE_KEY || (process.env as any).API_KEY || 'none'; 

export const supabase = createClient(supabaseUrl, supabaseKey);
