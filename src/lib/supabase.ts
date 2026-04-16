import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Variáveis de ambiente do Supabase não configuradas no cliente.")
}

export const supabase = createBrowserClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)
