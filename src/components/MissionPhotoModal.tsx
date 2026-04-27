"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Camera, Share2, Upload, Loader2, X, Check, Trash2 } from "lucide-react"
import { scheduleService } from "@/services/scheduleService"
import { compressImage } from "@/lib/imageCompression"
import { generatePolaroidBlob } from "@/lib/polaroidGenerator"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MissionPhotoModalProps {
  massId: string
  date: string
  time: string
  readers: string[]
  photoUrl?: string | null
  canUpload: boolean
  isAdmin?: boolean
  onPhotoUploaded?: (url: string | null) => void
}

export function MissionPhotoModal({ 
  massId, 
  date, 
  time, 
  readers, 
  photoUrl: initialPhotoUrl, 
  canUpload,
  isAdmin,
  onPhotoUploaded 
}: MissionPhotoModalProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // O modal começa aberto se o ID da missa estiver na URL
  const isOpenInUrl = searchParams.get('photoMassId') === massId
  const [isOpen, setIsOpen] = useState(isOpenInUrl)
  
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [hasChanged, setHasChanged] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Sincroniza o estado interno com a URL (para quando a página atualiza)
  useEffect(() => {
    const isNowOpen = searchParams.get('photoMassId') === massId
    if (isNowOpen !== isOpen) {
      setIsOpen(isNowOpen)
    }
  }, [searchParams, massId])

  const updateUrl = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (open) {
      params.set('photoMassId', massId)
    } else {
      params.delete('photoMassId')
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0]
    if (!originalFile) return

    setIsUploading(true)
    setUploadStatus("Processando...")
    
    try {
      // 1. Comprimir e converter para WebP (max 1200px)
      const compressedFile = await compressImage(originalFile, 1200, 1200)
      
      setUploadStatus("Enviando...")
      
      // 2. Upload para o Supabase
      const url = await scheduleService.uploadMissionPhoto(massId, compressedFile)
      
      setPhotoUrl(url)
      setHasChanged(true)
      onPhotoUploaded?.(url)
    } catch (error) {
      console.error("Erro ao processar foto:", error)
      alert("Erro ao processar imagem. Tente uma foto diferente.")
    } finally {
      setIsUploading(false)
      setUploadStatus("")
      // Limpar os inputs para permitir selecionar a mesma foto novamente se necessário
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (galleryInputRef.current) galleryInputRef.current.value = ""
    }
  }

  const handleDelete = async () => {
    if (!photoUrl) return
    if (!confirm("Tem certeza que deseja apagar esta foto do servidor?")) return
    
    setIsUploading(true)
    setUploadStatus("Apagando...")
    try {
      await scheduleService.deleteMissionPhoto(massId, photoUrl)
      setPhotoUrl(null)
      setHasChanged(true)
      onPhotoUploaded?.(null)
    } catch (error) {
      console.error("Erro ao apagar foto:", error)
      alert("Erro ao apagar foto.")
    } finally {
      setIsUploading(false)
      setUploadStatus("")
    }
  }

  const shareToWhatsApp = async () => {
    if (!photoUrl) return
    
    setIsSharing(true)
    try {
      // 1. Gerar a imagem da Polaroid
      const blob = await generatePolaroidBlob(photoUrl, date, time, readers)
      const file = new File([blob], `missao-cumprida-${format(new Date(), 'dd-MM')}.jpg`, { type: 'image/jpeg' })

      const shortNames = readers.map(name => name.split(' ')[0]).join(', ')
      const caption = `📸 Missão Cumprida! \n\n📅 ${format(parseISO(date), "dd/MM/yyyy")} às ${time.substring(0, 5)}\n📖 Leitores: ${shortNames}\n\n#LiturgiaSJE`

      // 2. Tentar usar Web Share API (Nativa do celular)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Missão Cumprida',
          text: caption,
        })
      } else {
        // Fallback para Desktop: Download da imagem + link do WhatsApp
        const downloadUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `polaroid-missao-${format(new Date(), 'dd-MM')}.jpg`
        link.click()
        URL.revokeObjectURL(downloadUrl)

        const waText = `${caption}\n\nVeja a foto completa: ${photoUrl}`
        window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error)
      // Fallback básico
      const waText = `📸 Missão Cumprida!\n📖 Leitores: ${readers.join(', ')}\n🔗 ${photoUrl}`
      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')
    } finally {
      setIsSharing(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    updateUrl(false)
    if (hasChanged) {
      router.refresh()
      setHasChanged(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose()
      else {
        setIsOpen(true)
        updateUrl(true)
      }
    }}>
      <DialogTrigger 
        render={
          <button 
            type="button"
            onClick={() => updateUrl(true)}
            className={cn(
              "p-1.5 rounded-full transition-all active:scale-90 cursor-pointer focus:outline-none border-none",
              photoUrl 
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                : "bg-stone-100 text-stone-500 hover:bg-stone-200",
              !canUpload && !photoUrl && "hidden"
            )}
          >
            <Camera className={cn("h-4 w-4", photoUrl && "fill-current")} />
          </button>
        }
      />

      <DialogContent className="max-w-[90vw] sm:max-w-md p-6 bg-[#fdfaf6] border-none rounded-[2rem] shadow-2xl focus:outline-none overflow-hidden">
        
        <div className="flex flex-col items-center gap-6">
          
          {/* Título e Status */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black text-[#4e342e] uppercase tracking-tight">Missão Cumprida</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Registro da Escala</p>
          </div>

          {/* Container Polaroid */}
          <div className="relative w-full group">
            {/* Sombra de profundidade */}
            <div className="absolute inset-0 bg-black/5 blur-xl rounded-xl translate-y-4 scale-95" />
            
            <div className="relative bg-white p-4 pb-12 shadow-xl border border-stone-100 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              {/* Área da Foto */}
              <div className="aspect-[1.25/1] w-full bg-stone-50 overflow-hidden relative border border-stone-50">
                {photoUrl ? (
                  <img src={photoUrl} alt="Missão Cumprida" className="w-full h-full object-cover" />
                ) : isUploading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{uploadStatus}</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-stone-300" />
                    </div>
                    <p className="text-[11px] text-stone-400 font-medium">
                      Escolha uma opção abaixo para registrar a foto da sua missão.
                    </p>
                  </div>
                )}
              </div>

              {/* Legenda Polaroid (Gochi Hand) */}
              <div className="mt-6 px-1 space-y-1">
                <p className="font-['Gochi_Hand'] text-xl text-[#4e342e] leading-none opacity-80">
                  {format(parseISO(date), "dd 'de' MMMM", { locale: ptBR })} - {time.substring(0, 5)}
                </p>
                <p className="font-['Gochi_Hand'] text-lg text-stone-500 leading-tight">
                   {readers.map(name => name.split(' ')[0]).join(', ')}
                </p>
              </div>

              {/* Vinhetas Decorativas */}
              <div className="absolute top-2 right-2 h-1 w-1 rounded-full bg-stone-100" />
              <div className="absolute top-2 left-2 h-1 w-1 rounded-full bg-stone-100" />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="w-full flex flex-col gap-3 pt-2">
            {!photoUrl && canUpload ? (
              <div className="flex gap-2">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={galleryInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 h-14 bg-[#4e342e] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#3d2924] transition-all disabled:opacity-50"
                >
                  <Camera className="h-4 w-4" />
                  Tirar Foto
                </button>
                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 h-14 bg-stone-100 text-stone-600 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-stone-200 transition-all disabled:opacity-50 border border-stone-200"
                >
                  <Upload className="h-4 w-4" />
                  Galeria
                </button>
              </div>
            ) : photoUrl ? (
              <div className="flex gap-2">
                <button 
                  onClick={shareToWhatsApp}
                  disabled={isSharing || isUploading}
                  className="flex-1 h-14 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-70"
                >
                  {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                  WhatsApp
                </button>
                {canUpload && (
                  <button 
                    onClick={handleDelete}
                    disabled={isUploading || isSharing}
                    className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all disabled:opacity-50 border border-red-100"
                    title="Excluir Foto"
                  >
                    {isUploading && uploadStatus === "Apagando..." ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  </button>
                )}
              </div>
            ) : null}
            
            <button 
              onClick={handleClose}
              className="w-full h-14 bg-stone-100 text-stone-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
              Fechar
            </button>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  )
}
