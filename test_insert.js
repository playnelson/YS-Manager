import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zdpqikulmmogvkkqbnrg.supabase.co';
const supabaseKey = 'sb_publishable_znpp5qgfQVocl8yzDLqpGA_HVWbjnyA'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Login as demo user to get access
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com', // wait, we don't have login, let me see if I can login
    password: 'password'       // I don't have user creds. 
  });
}
check();
