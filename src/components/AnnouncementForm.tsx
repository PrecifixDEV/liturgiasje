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
  }
  onSave: (data: { 
    id?: string;
    title: string; 
    content: string; 
    expires_at: Date | null;
    imageFile?: File | null;
    audioFile?: File | null;
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        imageFile,
        audioFile
      })
      onClose()
    } catch (error) {
      console.error("Erro ao salvar aviso:", error)
    } finally {
      setIsSubmitting(false)
    }
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

      {/* Upload de Mídia */}
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          <Label
            htmlFor="image-upload"
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-all hover:bg-stone-50",
              imageFile ? "border-green-200 bg-green-50/30" : "border-stone-100 bg-white"
            )}
          >
            {imageFile ? (
              <>
                <div className="relative">
                  <ImageIcon className="h-6 w-6 text-green-600" />
                  <button 
                    onClick={(e) => { e.preventDefault(); setImageFile(null); }}
                    className="absolute -top-2 -right-2 rounded-full bg-stone-800 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-[10px] text-green-700 font-medium truncate max-w-full px-2">
                  {imageFile.name}
                </span>
              </>
            ) : (
              <>
                <ImageIcon className="h-6 w-6 text-stone-300" />
                <span className="text-[10px] text-stone-500 font-medium">Adicionar Foto</span>
              </>
            )}
          </Label>
        </div>

        <div className="relative">
          <input
            type="file"
            id="audio-upload"
            accept="audio/*"
            className="hidden"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          />
          <Label
            htmlFor="audio-upload"
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-all hover:bg-stone-50",
              audioFile ? "border-amber-200 bg-amber-50/30" : "border-stone-100 bg-white"
            )}
          >
            {audioFile ? (
              <>
                <div className="relative">
                  <Music className="h-6 w-6 text-amber-600" />
                  <button 
                    onClick={(e) => { e.preventDefault(); setAudioFile(null); }}
                    className="absolute -top-2 -right-2 rounded-full bg-stone-800 p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-[10px] text-amber-700 font-medium truncate max-w-full px-2">
                  {audioFile.name}
                </span>
              </>
            ) : (
              <>
                <Music className="h-6 w-6 text-stone-300" />
                <span className="text-[10px] text-stone-500 font-medium">Adicionar Áudio</span>
              </>
            )}
          </Label>
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
