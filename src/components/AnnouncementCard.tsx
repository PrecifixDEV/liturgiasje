import { useState } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CheckCircle2, Megaphone, Music, Maximize2, Calendar as CalendarIcon, Clock, Eye, Pencil, Trash2, User as UserIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AnnouncementProps {
  id: string
  title: string
  content: string
  type: "Aviso" | "Troca"
  image_url?: string
  audio_url?: string
  expires_at?: string
  isRead?: boolean
  isAdmin?: boolean
  isLoggedIn?: boolean
  authorName?: string
  viewers?: { name: string; at: string }[]
  onRead?: (id: string) => void
  onUpdate?: (id: string, data: any) => void
  onDelete?: (id: string) => void
  onEdit?: (ann: any) => void
}

export function AnnouncementCard({
  id,
  title,
  content,
  type,
  image_url,
  audio_url,
  expires_at,
  isRead,
  isAdmin,
  isLoggedIn,
  authorName,
  viewers = [],
  onRead,
  onUpdate,
  onDelete,
  onEdit,
}: AnnouncementProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Só mostra animação se estiver logado e não tiver lido
  const shouldShowGlow = isLoggedIn && !isRead;

  return (
    <Card className={`overflow-hidden p-0 gap-0 transition-all duration-500 ${
      shouldShowGlow 
        ? `${isExpanded ? "border-amber-400 bg-white shadow-sm" : "border-amber-400 bg-white shadow-md animate-glow-pulse ring-2 ring-amber-100 ring-offset-1"}` 
        : isRead ? "border-green-500 bg-white/50 shadow-sm hover:bg-white/80" : "border-stone-200 bg-white/80 shadow-sm"
    }`}>
      {/* Barra de Ações Administrativas (Admin Only) */}
      {isAdmin && (
        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-3 py-0.5">
          {/* Esquerda: Visualizações */}
          <Popover>
            <PopoverTrigger render={
              <button className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-white/80 px-2 py-0.5 rounded-full border border-amber-200 transition-colors">
                <Eye className="h-3 w-3" />
                {viewers.length} {viewers.length === 1 ? 'visto' : 'vistos'}
              </button>
            } />
            <PopoverContent className="w-80 p-0" align="start">
              <div className="flex flex-col">
                <div className="border-b border-stone-100 bg-stone-50/50 px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Visualizado por
                  </span>
                </div>
                <div className="max-h-[250px] overflow-auto p-1.5">
                  {viewers.length === 0 ? (
                    <p className="px-3 py-4 text-center text-[10px] text-stone-400">Ninguém visualizou ainda</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {viewers.map((viewer, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-stone-50 rounded-md border border-transparent hover:border-stone-100 transition-all">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100">
                            <UserIcon className="h-2.5 w-2.5 text-stone-400" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold text-stone-700 truncate leading-tight" title={viewer.name}>
                              {viewer.name}
                            </span>
                            <span className="text-[8px] text-stone-400 leading-tight">
                              {format(new Date(viewer.at), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Direita: Ações */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onEdit?.({ id, title, content, expires_at })}
              className="p-1.5 hover:bg-amber-100 rounded-lg text-stone-500 hover:text-stone-800 transition-colors"
                title="Editar"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            {/* Expiração */}
            <Popover>
              <PopoverTrigger render={
                <button className="flex items-center gap-1.5 text-[10px] font-bold text-stone-600 hover:text-stone-900 bg-white px-2 py-0.5 rounded-lg border border-stone-200 transition-colors">
                  <Clock className="h-3 w-3 text-red-500" />
                  {expires_at ? `até ${format(new Date(expires_at), "dd/MM/yyyy", { locale: ptBR })}` : "Sem expiração"}
                </button>
              } />
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={expires_at ? new Date(expires_at) : undefined}
                  onSelect={(date) => onUpdate?.(id, { expires_at: date?.toISOString() })}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <button 
              onClick={() => onDelete?.(id)}
              className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
      <Accordion>
        <AccordionItem 
          value="item-1" 
          className="border-none"
          onOpenChange={setIsExpanded}
          disabled={!isLoggedIn}
        >
          <AccordionTrigger 
            className={`px-3 py-2 hover:no-underline ${!isLoggedIn ? 'cursor-default pointer-events-none' : ''}`}
            hideChevron={!isLoggedIn}
          >
            <div className="flex items-center gap-2 text-left w-full pr-2">
              <div className={`rounded-full p-2 shrink-0 ${type === 'Troca' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                <Megaphone className="h-4 w-4" />
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-stone-800 line-clamp-1">{title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                    {type}
                  </span>
                  {isRead && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                      <CheckCircle2 className="h-3 w-3" /> Visualizado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3 pt-0">
            <div className="space-y-2 pt-1.5">
              <p className="text-sm leading-relaxed text-stone-600 whitespace-pre-wrap">
                {content}
              </p>
              
              {image_url && (
                <div className="group relative w-full overflow-hidden rounded-xl border border-stone-100 bg-stone-50 shadow-sm transition-all hover:shadow-md">
                  <Dialog>
                    <DialogTrigger 
                      render={
                        <button className="relative w-full overflow-hidden cursor-zoom-in">
                          <img
                            src={image_url}
                            alt={title}
                            className="w-full h-auto max-h-[300px] object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white/90 p-2 rounded-full shadow-lg">
                              <Maximize2 className="h-5 w-5 text-stone-800" />
                            </div>
                          </div>
                        </button>
                      }
                    />
                    <DialogContent className="max-w-[95vw] sm:max-w-3xl p-1 border-none bg-transparent shadow-none overflow-hidden flex items-center justify-center">
                      <img
                        src={image_url}
                        alt={title}
                        className="w-full h-full object-contain rounded-lg animate-in zoom-in-95 duration-200"
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {audio_url && (
                <div className="group relative flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 pt-4 shadow-sm transition-all hover:border-amber-200 hover:shadow-md">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <div className="bg-amber-100 p-1.5 rounded-full">
                      <Music className="h-4 w-4 text-amber-700" />
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      Mensagem de Áudio
                    </span>
                  </div>
                  <audio 
                    src={audio_url} 
                    controls 
                    className="h-10 w-full brightness-95 contrast-125" 
                  />
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                </div>
              )}

              {/* Autor do Recado */}
              <div className="flex items-center justify-end px-1 pt-1">
                <span className="text-[10px] font-medium text-stone-400 italic">
                  Publicado por: {authorName || 'Administração'}
                </span>
              </div>

              {isLoggedIn && !isRead && (
                <Button
                  onClick={() => onRead?.(id)}
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs font-bold border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100/80 hover:text-green-800 rounded-lg transition-all active:scale-95"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar Leitura
                </Button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
