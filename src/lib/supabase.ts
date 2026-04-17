import { createClient } from './supabase/client'

// Mantemos a exportação da instância 'supabase' para não quebrar o código existente
// que ainda importa diretamente deste arquivo.
export const supabase = createClient()
