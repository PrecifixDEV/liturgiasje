import { supabase } from "@/lib/supabase"

export const unavailableService = {
  async listByUser(userId: string) {
    const { data, error } = await supabase
      .from('unavailable_dates')
      .select('date')
      .eq('user_id', userId)
    
    if (error) throw error
    return data.map(d => d.date)
  },

  async listManyByDate(date: string) {
    const { data, error } = await supabase
      .from('unavailable_dates')
      .select('user_id')
      .eq('date', date)
    
    if (error) throw error
    return data.map(d => d.user_id)
  },

  async toggleDate(userId: string, date: string) {
    // 1. Verificar se já existe
    const { data, error: checkError } = await supabase
      .from('unavailable_dates')
      .select('id')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle()
    
    if (checkError) throw checkError

    if (data) {
      // Remover
      const { error: deleteError } = await supabase
        .from('unavailable_dates')
        .delete()
        .eq('id', data.id)
      
      if (deleteError) throw deleteError
      return { action: 'removed' }
    } else {
      // Adicionar
      const { error: insertError } = await supabase
        .from('unavailable_dates')
        .insert({ user_id: userId, date })
      
      if (insertError) throw insertError
      return { action: 'added' }
    }
  }
}
