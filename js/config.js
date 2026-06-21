// ============================================
// CONFIGURAÇÃO DO SUPABASE
// Substitua pelos dados do seu projeto
// ============================================

const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_ANON_KEY = 'SUA_ANON_KEY_AQUI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
