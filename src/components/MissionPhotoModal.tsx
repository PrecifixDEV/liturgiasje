"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Camera, Share2, Upload, Loader2, X, Check } from "lucide-react"
import { scheduleService } from "@/services/scheduleService"
import { compressImage } from "@/lib/imageCompression"
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
  onPhotoUploaded?: (url: string) => void
}

export function MissionPhotoModal({ 
  massId, 
  date, 
  time, 
  readers, 
  photoUrl: initialPhotoUrl, 
  canUpload,
  onPhotoUploaded 
}: MissionPhotoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      onPhotoUploaded?.(url)
    } catch (error) {
      console.error("Erro ao processar foto:", error)
      alert("Erro ao processar imagem. Tente uma foto diferente.")
    } finally {
      setIsUploading(false)
      setUploadStatus("")
    }
  }

  const shareToWhatsApp = () => {
    const text = `📸 Missão Cumprida! Confira a foto da nossa missão na Liturgia SJE.\n\n📅 ${format(parseISO(date), "dd/MM/yyyy")} às ${time.substring(0, 5)}\n📖 Leitores: ${readers.join(", ")}\n\nVeja aqui: ${photoUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={
          <div 
            role="button"
            className={cn(
              "p-1.5 rounded-full transition-all active:scale-90 cursor-pointer",
              photoUrl 
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                : canUpload 
                  ? "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  : "hidden"
            )}
          >
            {photoUrl ? <Camera className="h-4 w-4 fill-current" /> : <Camera className="h-4 w-4" />}
          </div>
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
              <div className="aspect-square w-full bg-stone-50 overflow-hidden relative border border-stone-50">
                {photoUrl ? (
                  <img src={photoUrl} alt="Missão Cumprida" className="w-full h-full object-cover" />
                ) : isUploading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-stone-400">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Enviando...</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-stone-300" />
                    </div>
                    <p className="text-[11px] text-stone-400 font-medium">
                      Clique no botão abaixo para registrar a foto da sua missão.
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
                   {readers.join(", ")}
                </p>
              </div>

              {/* Vinhetas Decorativas */}
              <div className="absolute top-2 right-2 h-1 w-1 rounded-full bg-stone-100" />
              <div className="absolute top-2 left-2 h-1 w-1 rounded-full bg-stone-100" />
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="w-full flex gap-3 pt-2">
            {!photoUrl && canUpload ? (
              <>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 h-14 bg-[#4e342e] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#3d2924] transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Tirar Foto
                </button>
              </>
            ) : photoUrl ? (
              <button 
                onClick={shareToWhatsApp}
                className="flex-1 h-14 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
              >
                <Share2 className="h-4 w-4" />
                WhatsApp
              </button>
            ) : null}
            
            <button 
              onClick={() => setIsOpen(false)}
              className="px-6 h-14 bg-stone-100 text-stone-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
              Fechar
            </button>
          </div>

        </div>

      </DialogContent>
    </Dialog>
  )
}
