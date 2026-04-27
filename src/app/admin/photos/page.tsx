"use client"

import { useState, useEffect } from "react"
import { scheduleService } from "@/services/scheduleService"
import { useAuthContext } from "@/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { 
  Camera, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Users, 
  Loader2, 
  ChevronLeft,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { compressImage } from "@/lib/imageCompression"

export default function AdminPhotosPage() {
  const { profile, loading: authLoading } = useAuthContext()
  const router = useRouter()
  const [masses, setMasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMass, setEditingMass] = useState<any>(null)
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== 'admin')) {
      router.push('/')
    } else if (profile?.role === 'admin') {
      fetchPhotos()
    }
  }, [profile, authLoading])

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      const data = await scheduleService.getMassesWithPhotos()
      setMasses(data)
    } catch (error) {
      console.error("Erro ao buscar fotos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (mass: any) => {
    if (!confirm("Tem certeza que deseja apagar esta foto permanentemente do servidor?")) return

    try {
      await scheduleService.deleteMissionPhoto(mass.id, mass.photo_url)
      setMasses(masses.filter(m => m.id !== mass.id))
    } catch (error) {
      console.error("Erro ao excluir foto:", error)
      alert("Erro ao excluir foto.")
    }
  }

  const handleSaveDescription = async () => {
    if (!editingMass) return
    setIsSaving(true)
    try {
      await scheduleService.updatePhotoDescription(editingMass.id, description)
      setMasses(masses.map(m => m.id === editingMass.id ? { ...m, photo_description: description } : m))
      setEditingMass(null)
    } catch (error) {
      console.error("Erro ao salvar descrição:", error)
      alert("Erro ao salvar.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleReplacePhoto = async (mass: any, file: File) => {
    try {
      setLoading(true)
      // 1. Opcionalmente deletar a antiga antes (podemos delegar ao storage se usarmos mesmo nome, mas aqui geramos nomes aleatórios)
      // Para ser limpo, vamos deletar a antiga
      if (mass.photo_url) {
        const urlParts = mass.photo_url.split('/storage/v1/object/public/mass-photos/')
        const oldPath = urlParts[1]
        if (oldPath) {
          await (window as any).supabase.storage.from('mass-photos').remove([oldPath])
        }
      }

      // 2. Comprimir e subir nova
      const compressed = await compressImage(file, 1200, 1200)
      const newUrl = await scheduleService.uploadMissionPhoto(mass.id, compressed)
      
      setMasses(masses.map(m => m.id === mass.id ? { ...m, photo_url: newUrl } : m))
      alert("Foto substituída com sucesso!")
    } catch (error) {
      console.error("Erro ao substituir foto:", error)
      alert("Erro ao substituir foto.")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#4e342e]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
              <ChevronLeft className="h-5 w-5 text-stone-500" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-[#4e342e] uppercase tracking-tight">Gestão de Fotos</h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Missão Cumprida</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchPhotos} 
            className="text-stone-400 hover:text-[#4e342e]"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {masses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-4">
            <div className="h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-stone-200" />
            </div>
            <p className="font-bold uppercase text-xs tracking-widest">Nenhuma foto registrada ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {masses.map((mass) => (
              <div key={mass.id} className="group relative">
                {/* Polaroid Style Card */}
                <div className="bg-white p-3 pb-8 shadow-md border border-stone-100 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="aspect-square bg-stone-100 overflow-hidden relative mb-4">
                    <img 
                      src={mass.photo_url} 
                      alt="Missão" 
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Badge de Data */}
                    <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      {format(parseISO(mass.date), "dd/MM/yy")}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-[#4e342e]">
                          <Clock className="h-3 w-3" /> {mass.time.substring(0, 5)}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-stone-400 font-medium italic">
                          <ImageIcon className="h-3 w-3" /> {mass.special_description || "Missa Comum"}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-50">
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-bold mb-2 uppercase tracking-tighter">
                        <Users className="h-3 w-3" />
                        {mass.slots.map((s: any) => s.member?.full_name?.split(' ')[0]).join(', ')}
                      </div>
                      
                      {mass.photo_description && (
                        <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                          <p className="text-[11px] text-[#4e342e] font-medium leading-relaxed italic">
                            "{mass.photo_description}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions Overlay for Admins */}
                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger 
                          render={
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-[10px] font-bold uppercase tracking-widest h-9 border-stone-200"
                              onClick={() => {
                                setEditingMass(mass)
                                setDescription(mass.photo_description || "")
                              }}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Texto
                            </Button>
                          }
                        />
                        <DialogContent className="bg-white border-none rounded-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-[#4e342e] font-black uppercase text-sm tracking-tight">Editar Texto da Foto</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <textarea 
                              className="w-full h-32 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm focus:ring-2 focus:ring-[#4e342e]/10 outline-none resize-none"
                              placeholder="Adicione uma legenda ou observação para esta foto..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                            <Button 
                              onClick={handleSaveDescription}
                              disabled={isSaving}
                              className="w-full h-12 bg-[#4e342e] text-white rounded-xl font-bold uppercase text-xs tracking-widest"
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Texto"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        id={`replace-${mass.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleReplacePhoto(mass, file)
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-[10px] font-bold uppercase tracking-widest h-9 border-stone-200"
                        onClick={() => document.getElementById(`replace-${mass.id}`)?.click()}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Trocar
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest h-9"
                        onClick={() => handleDelete(mass)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
