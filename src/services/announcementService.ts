import { supabase } from "@/lib/supabase"

/**
 * Extrai o caminho relativo do arquivo dentro do bucket a partir de uma URL pública do Supabase.
 */
function extractPathFromUrl(url: string, bucketName: string = 'announcement_media'): string | null {
  if (!url) return null
  const searchStr = `/storage/v1/object/public/${bucketName}/`
  const index = url.indexOf(searchStr)
  if (index === -1) return null
  return url.substring(index + searchStr.length)
}

export interface CreateAnnouncementData {
  title: string
  content: string
  type: 'Aviso' | 'Troca'
  expires_at: Date | null
  imageFiles?: File[] | null
  audioFile?: File | null
}

export interface Announcement {
  id: string
  title: string
  content: string
  type: 'Aviso' | 'Troca'
  image_url?: string
  image_urls?: string[]
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

    const imageUrls: string[] = []
    let audioUrl = ""

    // 1. Upload de Imagens se houver
    if (data.imageFiles && data.imageFiles.length > 0) {
      for (const file of data.imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `announcements/images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('announcement_media')
          .upload(filePath, file)

        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('announcement_media')
          .getPublicUrl(filePath)
        
        imageUrls.push(publicUrl)
      }
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
        image_url: imageUrls[0] || "", // Mantém para retrocompatibilidade
        image_urls: imageUrls,
        audio_url: audioUrl,
        expires_at: data.expires_at?.toISOString(),
        created_by: user.id
      })

    if (error) throw error

    // 4. Disparar Notificação Push
    fetch('/api/push/send', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Novo Recado',
        body: data.title,
        url: '/avisos'
      }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.error('Erro ao disparar push:', err));
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
    // 1. Buscar o anúncio para saber quais arquivos deletar
    const { data: ann } = await supabase
      .from('announcements')
      .select('image_url, image_urls, audio_url')
      .eq('id', id)
      .single()

    if (ann) {
      const pathsToDelete: string[] = []
      
      // Coletar caminhos de imagens
      const urls = [...(ann.image_urls || []), ann.image_url].filter(Boolean) as string[]
      urls.forEach(url => {
        const path = extractPathFromUrl(url)
        if (path) pathsToDelete.push(path)
      })

      // Coletar caminho de áudio
      if (ann.audio_url) {
        const path = extractPathFromUrl(ann.audio_url)
        if (path) pathsToDelete.push(path)
      }

      // Deletar arquivos do Storage
      if (pathsToDelete.length > 0) {
        await supabase.storage
          .from('announcement_media')
          .remove(pathsToDelete)
      }
    }

    // 2. Deletar o registro no banco
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
    const { imageFiles, audioFile, ...rest } = data
    const finalData = { ...rest }

    // 1. Upload de Novas Imagens se houver
    if (imageFiles && imageFiles.length > 0) {
      const newUrls: string[] = []
      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `announcements/images/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('announcement_media')
          .upload(filePath, file)

        if (uploadError) throw uploadError
        
        const { data: { publicUrl } } = supabase.storage
          .from('announcement_media')
          .getPublicUrl(filePath)
        
        newUrls.push(publicUrl)
      }
      
      // Combinar com as URLs existentes passadas no rest.image_urls
      finalData.image_urls = [...(rest.image_urls || []), ...newUrls]
    }
    
    // Garantir que image_url esteja sempre sincronizado com o primeiro item do array
    if (finalData.image_urls) {
      finalData.image_url = finalData.image_urls[0] || ""
    }

    // 2. Upload de Novo Áudio se houver
    if (audioFile) {
      const fileExt = audioFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `announcements/audio/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('announcement_media')
        .upload(filePath, audioFile)

      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('announcement_media')
        .getPublicUrl(filePath)
      
      finalData.audio_url = publicUrl
    } else if (data.audio_url === null || data.audio_url === "") {
      finalData.audio_url = ""
    }

    // 0. Antes de atualizar, verificar mídias removidas para limpar o Storage
    const { data: oldAnn } = await supabase
      .from('announcements')
      .select('image_urls, audio_url')
      .eq('id', id)
      .single()

    if (oldAnn) {
      const removedFiles: string[] = []
      
      // Verificar imagens removidas
      if (oldAnn.image_urls && Array.isArray(oldAnn.image_urls)) {
        const newUrls = finalData.image_urls || []
        oldAnn.image_urls.forEach((oldUrl: string) => {
          if (!newUrls.includes(oldUrl)) {
            const path = extractPathFromUrl(oldUrl)
            if (path) removedFiles.push(path)
          }
        })
      }

      // Verificar áudio removido
      if (oldAnn.audio_url && finalData.audio_url !== undefined && finalData.audio_url !== oldAnn.audio_url) {
        const path = extractPathFromUrl(oldAnn.audio_url)
        if (path) removedFiles.push(path)
      }

      if (removedFiles.length > 0) {
        await supabase.storage
          .from('announcement_media')
          .remove(removedFiles)
          .catch(err => console.error("Erro ao limpar arquivos antigos:", err))
      }
    }

    const { error } = await supabase
      .from('announcements')
      .update(finalData)
      .eq('id', id)

    if (error) throw error
  }
}
