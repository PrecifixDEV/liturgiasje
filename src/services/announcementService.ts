import { supabase } from "@/lib/supabase"

export interface CreateAnnouncementData {
  title: string
  content: string
  type: 'Aviso' | 'Troca'
  expires_at: Date | null
  imageFile?: File | null
  audioFile?: File | null
}

export const announcementService = {
  async create(data: CreateAnnouncementData) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado")

    let imageUrl = ""
    let audioUrl = ""

    // 1. Upload de Imagem se houver
    if (data.imageFile) {
      const fileExt = data.imageFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `announcements/images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('announcement_media')
        .upload(filePath, data.imageFile)

      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('announcement_media')
        .getPublicUrl(filePath)
      
      imageUrl = publicUrl
    }

    // 2. Upload de Áudio se houver
    if (data.audioFile) {
      const fileExt = data.audioFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `announcements/audio/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('announcement_media')
        .upload(filePath, data.audioFile)

      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('announcement_media')
        .getPublicUrl(filePath)
      
      audioUrl = publicUrl
    }

    // 3. Salvar no Banco
    const { error } = await supabase
      .from('announcements')
      .insert({
        title: data.title,
        content: data.content,
        type: data.type,
        image_url: imageUrl,
        audio_url: audioUrl,
        expires_at: data.expires_at?.toISOString(),
        created_by: user.id
      })

    if (error) throw error
  },

  async list(userId?: string) {
    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        views:announcement_views(user_id)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const now = new Date()
    return (announcements || [])
      .filter(ann => !ann.expires_at || new Date(ann.expires_at) > now)
      .map(ann => ({
        ...ann,
        isRead: ann.views?.some((v: any) => v.user_id === userId) || false
      }))
  },

  async markAsRead(announcementId: string, userId: string) {
    const { error } = await supabase
      .from('announcement_views')
      .insert({
        announcement_id: announcementId,
        user_id: userId
      })

    if (error) throw error
  },

  async update(id: string, data: any) {
    const { error } = await supabase
      .from('announcements')
      .update(data)
      .eq('id', id)

    if (error) throw error
  }
}
