import { supabase } from "@/lib/supabase"

export interface Member {
  id: string
  full_name: string
  whatsapp?: string
  is_claimed: boolean
  claimed_by?: string
  created_at: string
}

export const memberService = {
  async listAll() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('full_name')
    
    if (error) throw error
    return data
  },

  async search(name: string) {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .ilike('full_name', `%${name}%`)
      .eq('is_claimed', false)
      .limit(10)
    
    if (error) throw error
    return data
  },

  async create(data: { full_name: string, whatsapp?: string }) {
    const { data: member, error } = await supabase
      .from('members')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    return member
  },

  async update(id: string, data: Partial<Member>) {
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
  }
}
