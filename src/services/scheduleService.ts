import { supabase } from "@/lib/supabase"
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

export const scheduleService = {
  async listForMonth(date: Date, isAdmin: boolean = false) {
    const start = startOfMonth(date)
    const end = endOfMonth(date)

    // Buscar missas do mês selecionado
    let query = supabase
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

    if (!isAdmin) {
      query = query.eq('is_published', true)
    }

    const { data: masses, error: massesError } = await query
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .order('created_at', { foreignTable: 'schedule_slots', ascending: true })

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
        .select('id, full_name, user:users!claimed_by(full_name)')
        .in('id', Array.from(memberIds))

      if (membersError) console.error("Erro ao buscar membros:", membersError)
      if (members) {
        memberNames = Object.fromEntries(members.map(m => [
          m.id, 
          { full_name: (m as any).user?.full_name || m.full_name }
        ]))
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

  async confirmSlot(slotId: string, userId: string) {
    const { data, error } = await supabase
      .from('schedule_slots')
      .update({ 
        is_confirmed: true,
        reader_id: userId
      })
      .eq('id', slotId)
      .select()

    if (error) throw error
    
    if (!data || data.length === 0) {
      throw new Error("Não foi possível confirmar. Verifique suas permissões no banco de dados.")
    }

    return data[0]
  },

  async requestSwap(slotId: string) {
    const { error } = await supabase
      .from('schedule_slots')
      .update({ is_swap_requested: true })
      .eq('id', slotId)

    if (error) throw error

    // Disparar Notificação Push para todos avisando da solicitação de troca
    fetch('/api/push/send', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Solicitação de Troca',
        body: 'Alguém solicitou uma troca de escala. Confira no mural!',
        url: '/'
      }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('Erro ao disparar push de troca:', err));
  },

  async cancelSwapRequest(slotId: string) {
    const { error } = await supabase
      .from('schedule_slots')
      .update({ is_swap_requested: false })
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
    month_reference: string;
  }, slots: { role: string; member_id: string }[]) {
    // 1. Criar a missa
    const { data: mass, error: massError } = await supabase
      .from('masses')
      .insert({ ...massData, is_published: false })
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
  },

  async publishMonth(monthReference: string) {
    // 1. Marcar todas as missas do mês como publicadas
    const { data: masses, error: publishError } = await supabase
      .from('masses')
      .update({ is_published: true })
      .eq('month_reference', monthReference)
      .select('id, date')

    if (publishError) throw publishError

    // 2. Buscar todos os slots e membros para disparar notificações
    if (masses && masses.length > 0) {
      const massIds = masses.map(m => m.id)
      
      const { data: slots, error: slotsError } = await supabase
        .from('schedule_slots')
        .select('member_id')
        .in('mass_id', massIds)
        .not('member_id', 'is', null)

      if (slotsError) console.error("Erro ao buscar slots para notificação:", slotsError)

      if (slots && slots.length > 0) {
        const memberIds = [...new Set(slots.map(s => s.member_id))]
        
        const { data: membersList } = await supabase
          .from('members')
          .select('claimed_by')
          .in('id', memberIds)

        const targetUserIds = [...new Set((membersList || []).map(m => m.claimed_by).filter(id => !!id))]

        if (targetUserIds.length > 0) {
          const monthName = format(parseISO(masses[0].date), 'MMMM', { locale: ptBR })
          
          fetch('/api/push/send', {
            method: 'POST',
            body: JSON.stringify({
              title: 'Você foi escalado! 📅',
              body: `Confira seus horários de leitura na nova escala de ${monthName}.`,
              url: '/',
              targetUserIds
            }),
            headers: { 'Content-Type': 'application/json' }
          }).catch(err => console.error('Erro ao disparar push na publicação:', err));
        }
      }
    }
  },

  async updateMass(massId: string, massData: any, slots: { role: string; member_id: string }[]) {
    // 1. Atualizar a missa
    const { error: massError } = await supabase
      .from('masses')
      .update({ ...massData, is_published: false })
      .eq('id', massId)

    if (massError) throw massError

    // 2. Remover slots antigos
    const { error: deleteError } = await supabase
      .from('schedule_slots')
      .delete()
      .eq('mass_id', massId)

    if (deleteError) throw deleteError

    // 3. Inserir novos slots
    if (slots.length > 0) {
      const slotsToInsert = slots.map(slot => ({
        mass_id: massId,
        role: slot.role,
        member_id: slot.member_id
      }))

      const { error: slotsError } = await supabase
        .from('schedule_slots')
        .insert(slotsToInsert)

      if (slotsError) throw slotsError
    }
  },

  async listAllSwaps() {
    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        id,
        role,
        reader_id,
        member_id,
        is_swap_requested,
        reader:users!reader_id (
          full_name,
          avatar_url
        ),
        member:members!member_id (
          full_name
        ),
        mass:masses (
          date,
          time,
          special_description
        )
      `)
      .eq('is_swap_requested', true)
      .gte('mass.date', new Date().toISOString().split('T')[0]) // Apenas trocas futuras ou hoje
      .order('mass(date)', { ascending: true })

    if (error) throw error
    return data || []
  },

  async deleteMass(massId: string) {
    const { error } = await supabase
      .from('masses')
      .delete()
      .eq('id', massId)
    
    if (error) throw error
  },

  async acceptSwap(slotId: string, newReaderId: string, newMemberId?: string) {
    // 1. Atualizar o slot
    const { data: slot, error: slotError } = await supabase
      .from('schedule_slots')
      .update({ 
        reader_id: newReaderId,
        member_id: newMemberId || undefined,
        is_swap_requested: false,
        is_confirmed: true 
      })
      .eq('id', slotId)
      .select()

    if (slotError) throw slotError
  },
  async checkMassExists(date: string) {
    const { data, error } = await supabase
      .from('masses')
      .select('id')
      .eq('date', date)

    if (error) throw error
    return data || []
  },

  async listForMemberThisMonth(memberId: string) {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)

    const { data, error } = await supabase
      .from('schedule_slots')
      .select(`
        id,
        role,
        is_confirmed,
        mass:masses!inner (
          id,
          date,
          time,
          special_description,
          is_published
        )
      `)
      .eq('member_id', memberId)
      .eq('mass.is_published', true)
      .gte('mass.date', format(start, 'yyyy-MM-dd'))
      .lte('mass.date', format(end, 'yyyy-MM-dd'))
      .order('mass(date)', { ascending: true })

    if (error) throw error
    return data || []
  }
}
