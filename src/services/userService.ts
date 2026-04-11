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
    // 1. Validar unicidade do nome se ele for alterado
    if (profile.full_name) {
      // Primeiro, pegamos o ID do membro atual deste usuário
      const { data: currentMember } = await supabase
        .from('members')
        .select('id')
        .eq('claimed_by', userId)
        .maybeSingle()

      // Agora buscamos se existe outro membro com o mesmo nome
      const query = supabase
        .from('members')
        .select('id')
        .ilike('full_name', profile.full_name)
      
      if (currentMember) {
        query.neq('id', currentMember.id)
      }

      const { data: existingMember, error: checkError } = await query.maybeSingle()

      if (checkError) throw checkError
      if (existingMember) {
        throw new Error("NAME_ALREADY_IN_USE")
      }
    }

    // 2. Atualizar o perfil do usuário
    const { data, error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error

    // 2. Se o nome ou whatsapp foram alterados, sincronizar com a tabela de membros
    const syncData: any = {}
    if (profile.full_name) syncData.full_name = profile.full_name
    if (profile.whatsapp) syncData.whatsapp = profile.whatsapp

    if (Object.keys(syncData).length > 0) {
      await supabase
        .from('members')
        .update(syncData)
        .eq('claimed_by', userId)
    }

    return data
  },

  async uploadAvatar(userId: string, file: Blob): Promise<string> {
    const fileName = `${userId}/avatar-${Date.now()}.webp`
    
    // 1. Upload do arquivo
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        contentType: 'image/webp',
        upsert: true
      })

    if (uploadError) throw uploadError

    // 2. Pegar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // 3. Atualizar o perfil com a nova URL
    await this.updateProfile(userId, { avatar_url: publicUrl })

    return publicUrl
  },

  async updateRole(userId: string, role: 'admin' | 'reader') {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async listBirthdays() {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, birth_date')
      .not('birth_date', 'is', null)
      .order('birth_date')

    if (error) throw error
    return data
  }
}
