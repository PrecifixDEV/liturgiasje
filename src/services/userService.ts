import { supabase } from "@/lib/supabase"

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'admin' | 'reader'
  whatsapp?: string
  birth_date?: string
  preferences?: any
  claimed_at?: string
  is_self_registered?: boolean
}

export const userService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return data
  },

  async createProfile(profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('users')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProfile(userId: string, profile: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
