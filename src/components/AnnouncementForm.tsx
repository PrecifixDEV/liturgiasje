"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Loader2, Image as ImageIcon, Music, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnnouncementFormProps {
  initialData?: {
    id: string;
    title: string;
    content: string;
    expires_at?: string;
    image_url?: string;
    image_urls?: string[];
    audio_url?: string;
  }
  onSave: (data: { 
    id?: string;
    title: string; 
    content: string; 
    expires_at: Date | null;
    imageFiles?: File[] | null;
    image_urls?: string[]; // URLs mantidas
    audioFile?: File | null;
    audio_url?: string | null; // URL mantida ou null se removida
  }) => Promise<void>
  onClose: () => void
}

export function AnnouncementForm({ initialData, onSave, onClose }: AnnouncementFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [content, setContent] = useState(initialData?.content || "")
  const [hasExpiration, setHasExpiration] = useState(!!initialData?.expires_at)
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    initialData?.expires_at ? new Date(initialData.expires_at) : undefined
  )
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.image_urls || (initialData?.image_url ? [initialData.image_url] : []))
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [existingAudio, setExistingAudio] = useState<string | null>(initialData?.audio_url || null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canAddMoreImages = (existingImages.length + imageFiles.length) < 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) return

    setIsSubmitting(true)
    try {
      await onSave({
        id: initialData?.id,
        title,
        content,
        expires_at: hasExpiration ? (expirationDate || null) : null,
        imageFiles: imageFiles.length > 0 ? imageFiles : null,
        image_urls: existingImages,
        audioFile,
        audio_url: existingAudio
      })
      onClose()
    } catch (error) {
      console.error("Erro ao salvar aviso:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = 3 - (existingImages.length + imageFiles.length)
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files.slice(0, remainingSlots)])
    }
  }

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url))
  }

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-stone-700">Título do Aviso</Label>
        <Input
          id="title"
          placeholder="Ex: Reunião Geral"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border-stone-200 focus-visible:ring-stone-400"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="text-stone-700">Conteúdo</Label>
        <Textarea
          id="content"
          placeholder="Descreva o aviso aqui..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="min-h-[120px] border-stone-200 focus-visible:ring-stone-400"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-stone-700">Imagens (Até 3)</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Imagens Existentes */}
          {existingImages.map((url, idx) => (
            <div key={`existing-${idx}`} className="relative group aspect-square rounded-lg border-2 border-stone-100 overflow-hidden bg-stone-50">
              <img src={url} alt="Anexo" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.preventDefault(); removeExistingImage(url); }}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white shadow-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Novas Imagens */}
          {imageFiles.map((file, idx) => (
            <div key={`new-${idx}`} className="relative group aspect-square rounded-lg border-2 border-green-200 overflow-hidden bg-green-50/30">
              <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
              <button 
                onClick={(e) => { e.preventDefault(); removeNewImage(idx); }}
                className="absolute top-1 right-1 rounded-full bg-stone-800 p-1 text-white shadow-sm opacity-90 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Botão de Adicionar */}
          {canAddMoreImages && (
            <div className="relative aspect-square">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
              <Label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center h-full w-full rounded-lg border-2 border-dashed border-stone-100 bg-white cursor-pointer transition-all hover:bg-stone-50"
              >
                <ImageIcon className="h-6 w-6 text-stone-300" />
                <span className="text-[10px] text-stone-500 font-medium mt-1">Adicionar</span>
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Upload de Áudio */}
      <div className="space-y-3">
        <Label className="text-stone-700">Áudio</Label>
        <div className="relative">
          <input
            type="file"
            id="audio-upload"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              setAudioFile(e.target.files?.[0] || null);
              setExistingAudio(null); // Ao escolher um novo, remove a referência do antigo
            }}
          />
          
          {(audioFile || existingAudio) ? (
            <div className={cn(
              "flex items-center justify-between gap-3 rounded-lg border-2 p-3",
              audioFile ? "border-green-200 bg-green-50/30" : "border-stone-100 bg-stone-50"
            )}>
              <div className="flex items-center gap-2 overflow-hidden">
                <Music className={cn("h-5 w-5", audioFile ? "text-green-600" : "text-stone-400")} />
                <span className="text-xs font-medium truncate text-stone-700">
                  {audioFile ? audioFile.name : "Áudio existente"}
                </span>
              </div>
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setAudioFile(null); 
                  setExistingAudio(null);
                }}
                className="rounded-full bg-stone-800 p-1 text-white hover:bg-stone-900 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <Label
              htmlFor="audio-upload"
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-100 p-4 bg-white cursor-pointer transition-all hover:bg-stone-50"
            >
              <Music className="h-6 w-6 text-stone-300" />
              <span className="text-xs text-stone-500 font-medium">Adicionar Áudio</span>
            </Label>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-stone-100 bg-stone-50/50 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-stone-800">Data de Expiração</Label>
            <p className="text-[10px] text-stone-500">O aviso sumirá automaticamente após esta data</p>
          </div>
          <Switch
            checked={hasExpiration}
            onCheckedChange={setHasExpiration}
          />
        </div>

        {hasExpiration && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            <Popover>
              <PopoverTrigger
                render={
                  <Button 
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-stone-200",
                      !expirationDate && "text-stone-400"
                    )}
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expirationDate ? format(expirationDate, "PPP", { locale: ptBR }) : <span>Selecione a data</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  initialFocus
                  locale={ptBR}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          className="flex-1 text-stone-500"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-stone-800 hover:bg-stone-900 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            initialData ? "Salvar Alterações" : "Publicar Aviso"
          )}
        </Button>
      </div>
    </form>
  )
}
