// ============================================
// CONFIGURAÇÃO DO SUPABASE
// Substitua pelos dados do seu projeto
// ============================================

const SUPABASE_URL = 'https://bfqxqehtxghzosvservi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmcXhxZWh0eGdoem9zdnNlcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTgyNTQsImV4cCI6MjA5NzYzNDI1NH0.Syd9V3P_N_3cDauBW07Xjl9l5dajJsSzsYhlK0mUtPI';

var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
