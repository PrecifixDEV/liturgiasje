import { supabase } from "@/lib/supabase"

export interface CreateAnnouncementData {
  title: string
  content: string
  type: 'Aviso' | 'Troca'
  expires_at: Date | null
  imageFile?: File | null
  audioFile?: File | null
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'Aviso' | 'Troca'
  image_url?: string
  audio_url?: string
  expires_at?: string
  created_at: string
  created_by: string
  authorName?: string
  isRead: boolean
  viewers: { name: string, at: string }[]
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
        author:users!created_by(full_name),
        views:announcement_views(
          user_id,
          viewed_at,
          user:users(full_name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const now = new Date()
    return (announcements || [])
      .filter(ann => !ann.expires_at || new Date(ann.expires_at) > now)
      .map(ann => ({
        ...ann,
        authorName: ann.author?.full_name,
        isRead: ann.created_by === userId || ann.views?.some((v: any) => v.user_id === userId) || false,
        viewers: ann.views?.map((v: any) => ({
          name: v.user?.full_name || 'Usuário',
          at: v.viewed_at
        })) || []
      }))
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error
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
