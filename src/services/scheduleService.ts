import { supabase } from "@/lib/supabase"
import { startOfMonth, endOfMonth, format } from "date-fns"

export const scheduleService = {
  async listForMonth(date: Date) {
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    // Buscar missas do mês selecionado
    const { data: masses, error: massesError } = await supabase
      .from('masses')
      .select(`
        *,
        slots:schedule_slots (
          id,
          mass_id,
          role,
          reader_id,
          original_reader_id,
          is_confirmed,
          is_swap_requested,
          created_at
        )
      `)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (massesError) {
      console.error("Erro ao buscar escala:", massesError)
      throw massesError
    }

    // Buscar nomes dos usuários separadamente (evita bloqueio RLS em joins aninhados)
    const readerIds = new Set<string>()
    for (const mass of masses || []) {
      for (const slot of mass.slots) {
        if (slot.reader_id) readerIds.add(slot.reader_id)
        if (slot.original_reader_id) readerIds.add(slot.original_reader_id)
      }
    }

    let userNames: Record<string, { full_name: string }> = {}
    if (readerIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', Array.from(readerIds))

      if (usersError) {
        console.error("Erro ao buscar usuários:", usersError)
      }

      if (users) {
        userNames = Object.fromEntries(users.map(u => [u.id, { full_name: u.full_name }]))
      }
    }

    // Mesclar os nomes nos slots
    for (const mass of masses || []) {
      for (const slot of mass.slots) {
        Object.assign(slot, {
          reader: slot.reader_id ? userNames[slot.reader_id] : null,
          original_reader: slot.original_reader_id ? userNames[slot.original_reader_id] : null,
        })
      }
    }

    return masses || []
  },

  async confirmSlot(slotId: string) {
    const { error } = await supabase
      .from('schedule_slots')
      .update({ is_confirmed: true })
      .eq('id', slotId)

    if (error) throw error
  },

  async requestSwap(slotId: string) {
    const { error } = await supabase
      .from('schedule_slots')
      .update({ is_swap_requested: true })
      .eq('id', slotId)

    if (error) throw error
  }
}
