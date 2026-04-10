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
          member_id,
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
    const memberIds = new Set<string>()
    for (const mass of masses || []) {
      for (const slot of mass.slots) {
        if (slot.reader_id) readerIds.add(slot.reader_id)
        if (slot.member_id) memberIds.add(slot.member_id)
        if (slot.original_reader_id) readerIds.add(slot.original_reader_id)
      }
    }

    let userNames: Record<string, { full_name: string; avatar_url: string | null }> = {}
    let memberNames: Record<string, { full_name: string }> = {}

    if (readerIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(readerIds))

      if (usersError) console.error("Erro ao buscar usuários:", usersError)
      if (users) {
        userNames = Object.fromEntries(users.map(u => [u.id, { full_name: u.full_name, avatar_url: u.avatar_url || null }]))
      }
    }

    if (memberIds.size > 0) {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, full_name')
        .in('id', Array.from(memberIds))

      if (membersError) console.error("Erro ao buscar membros:", membersError)
      if (members) {
        memberNames = Object.fromEntries(members.map(m => [m.id, { full_name: m.full_name }]))
      }
    }

    // Mesclar os nomes e avatares nos slots
    for (const mass of masses || []) {
      for (const slot of mass.slots) {
        const user = slot.reader_id ? userNames[slot.reader_id] : null
        const member = slot.member_id ? memberNames[slot.member_id] : null
        
        Object.assign(slot, {
          reader: user || null,
          member: member || null,
          reader_name: user?.full_name || member?.full_name || "---",
          avatar_url: user?.avatar_url || null,
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
  },

  async getMembersUsage(monthReference: string) {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        member_id,
        mass:masses!inner(month_reference)
      `)
      .eq('mass.month_reference', monthReference)

    if (error) throw error

    // Contar ocorrências por member_id
    const counts: Record<string, number> = {}
    data?.forEach((slot: any) => {
      if (slot.member_id) {
        counts[slot.member_id] = (counts[slot.member_id] || 0) + 1
      }
    })

    return counts
  },

  async createMassWithSlots(massData: { 
    date: string; 
    time: string; 
    special_description?: string; 
    external_group?: string;
    month_reference: string;
  }, slots: { role: string; member_id: string }[]) {
    // 1. Criar a missa
    const { data: mass, error: massError } = await supabase
      .from('masses')
      .insert(massData)
      .select()
      .single()

    if (massError) throw massError

    // 2. Criar os slots associados
    if (slots.length > 0) {
      const slotsToInsert = slots.map(slot => ({
        mass_id: mass.id,
        role: slot.role,
        member_id: slot.member_id
      }))

      const { error: slotsError } = await supabase
        .from('schedule_slots')
        .insert(slotsToInsert)

      if (slotsError) throw slotsError
    }

    return mass
  }
}
