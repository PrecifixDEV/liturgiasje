import { supabase } from "@/lib/supabase"

export interface Member {
  id: string
  full_name: string
  whatsapp?: string
  is_claimed: boolean
  claimed_by?: string
  created_at: string
  claimed_user?: {
    avatar_url: string | null
    role?: 'admin' | 'reader'
    preferences?: any
  }
}

export const memberService = {
  async listAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*, claimed_user:users!claimed_by(full_name, avatar_url, role, preferences)')
      .order('full_name')
    
    if (error) throw error
    
    return (data || []).map(m => ({
      ...m,
      full_name: (m as any).claimed_user?.full_name || m.full_name
    })) as Member[]
  },

  async search(query: string) {
    // Se a query contiver apenas números (ou números com caracteres de telefone), 
    // criar uma versão flexível para o WhatsApp
    const digitsOnly = query.replace(/\D/g, "")
    // Só aplica a busca flexível (%9%9...) se o usuário digitar pelo menos 4 números
    const whatsappQuery = (digitsOnly && digitsOnly.length >= 4) 
      ? `%${digitsOnly.split("").join("%")}%` 
      : `%${query}%`

    const { data, error } = await supabase
      .from('members')
      .select('*, claimed_user:users!claimed_by(full_name, avatar_url)')
      .or(`full_name.ilike.%${query}%,whatsapp.ilike.${whatsappQuery}`)
      .eq('is_claimed', false)
      .limit(10)
    
    if (error) throw error

    return (data || []).map(m => ({
      ...m,
      full_name: (m as any).claimed_user?.full_name || m.full_name
    }))
  },

  async create(data: { full_name: string, whatsapp?: string, is_claimed?: boolean, claimed_by?: string }) {
    // 1. Validar unicidade do nome
    const { data: existing, error: checkError } = await supabase
      .from('members')
      .select('id')
      .ilike('full_name', data.full_name)
      .maybeSingle()

    if (checkError) throw checkError
    if (existing) {
      throw new Error("NAME_ALREADY_IN_USE")
    }

    const { data: member, error } = await supabase
      .from('members')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return member
  },

  async update(id: string, data: Partial<Member>) {
    // 1. Validar unicidade do nome se ele for alterado
    if (data.full_name) {
      const { data: existing, error: checkError } = await supabase
        .from('members')
        .select('id')
        .ilike('full_name', data.full_name)
        .neq('id', id)
        .maybeSingle()

      if (checkError) throw checkError
      if (existing) {
        throw new Error("NAME_ALREADY_IN_USE")
      }
    }

    const { data: member, error } = await supabase
      .from('members')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return member
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async claim(memberId: string, userId: string) {
    const { data: member, error } = await supabase
      .from('members')
      .update({
        is_claimed: true,
        claimed_by: userId
      })
      .eq('id', memberId)
      .select()
      .single()
    
    if (error) throw error
    return member
  },

  async getByUserId(userId: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*, claimed_user:users!claimed_by(full_name, avatar_url, role, preferences)')
      .eq('claimed_by', userId)
      .maybeSingle()
    
    if (error) throw error
    if (!data) return null

    return {
      ...data,
      full_name: (data as any).claimed_user?.full_name || data.full_name
    } as Member
  }
}
