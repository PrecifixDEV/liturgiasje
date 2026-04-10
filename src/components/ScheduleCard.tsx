"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CalendarDays, Clock, RefreshCw, CheckCircle, UserPlus, Pencil, Trash2 } from "lucide-react"

interface ReaderSlot {
  id: string
  role: "C" | "1L" | "2L" | "P" | "L"
  roleName?: string
  readerName?: string
  avatarUrl?: string
  originalReaderName?: string
  isConfirmed: boolean
  isSwapRequested: boolean
  isMine?: boolean
}

interface ScheduleCardProps {
  date: string
  items: {
    id: string
    time: string
    specialTitle?: string
    slots: ReaderSlot[]
  }[]
  onConfirm?: (slotId: string) => void
  onRequestSwap?: (slotId: string) => void
  onTakeSwap?: (slotId: string) => void
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: (massIds: string[]) => void
}

export function ScheduleCard({
  date,
  items,
  onConfirm,
  onRequestSwap,
  onTakeSwap,
  isAdmin,
  onEdit,
  onDelete,
}: ScheduleCardProps) {
  const allMassIds = items.map(item => item.id);

  const adminBar = isAdmin && (
    <div className="flex items-center justify-end gap-2 border-b border-stone-100 bg-stone-50/50 px-3 py-1">
      <button 
        onClick={() => onEdit?.()}
        className="p-1 px-1.5 hover:bg-amber-100 rounded-lg text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1.5 text-[10px] font-bold"
        title="Editar Dia"
      >
        <Pencil className="h-3.5 w-3.5" />
        EDITAR DIA
      </button>
      <button 
        onClick={() => onDelete?.(allMassIds)}
        className="p-1 px-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-600 transition-colors flex items-center gap-1.5 text-[10px] font-bold"
        title="Excluir Dia"
      >
        <Trash2 className="h-3.5 w-3.5" />
        EXCLUIR DIA
      </button>
    </div>
  );

  return (
    <Card className="overflow-hidden border-stone-200 bg-white shadow-sm p-0 gap-0">
      {adminBar}
      <CardHeader className="bg-stone-50/50 p-4 pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2 text-stone-700">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm font-bold uppercase tracking-tight">{date}</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {items.map((item, itemIndex) => (
          <div key={item.id} className={cn("flex flex-col", itemIndex > 0 && "border-t-4 border-stone-100")}>
            {/* Sub-header do Horário */}
            <div className="flex items-center bg-stone-50/30 px-4 py-2 border-b border-stone-50 gap-3">
              <div className="flex items-center gap-2 text-stone-600">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs font-black tracking-tight">
                  {item.time} {item.specialTitle && <span className="text-stone-600 ml-1"> — {item.specialTitle}</span>}
                </span>
              </div>
            </div>

              <div className="divide-y divide-stone-100">
                {item.slots.map((slot) => (
                  <div 
                    key={slot.id} 
                    className={cn(
                      "flex flex-col px-4 py-3 space-y-1 transition-colors",
                      slot.isConfirmed ? "bg-green-50/70 border-l-4 border-l-green-600" : ""
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {slot.avatarUrl ? (
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-stone-100 shadow-sm">
                                <img src={slot.avatarUrl} alt={slot.readerName} className="h-full w-full object-cover" />
                              </div>
                            ) : (
                              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black border transition-all ${
                                slot.isSwapRequested 
                                  ? "bg-amber-100 text-amber-700 border-amber-200 animate-pulse ring-2 ring-amber-100 ring-offset-1" 
                                  : slot.isConfirmed
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-stone-50 text-stone-600 border-stone-200"
                              }`}>
                                {slot.isSwapRequested ? (
                                  <RefreshCw className="h-4 w-4" />
                                ) : (
                                  slot.role
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-bold text-stone-800 leading-tight truncate">
                              {slot.readerName || "---"}
                            </span>
                            {slot.originalReaderName && slot.readerName !== slot.originalReaderName && (
                              <span className="text-[9px] font-medium text-stone-400 italic">
                                substituiu {slot.originalReaderName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {slot.isConfirmed && (
                            <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase tracking-tighter">
                              <CheckCircle className="h-4 w-4 fill-green-50" />
                              Confirmado
                            </div>
                          )}
                        
                        {slot.isMine && !slot.isConfirmed && !slot.isSwapRequested && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-[10px] font-bold text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                              onClick={() => onRequestSwap?.(slot.id)}
                            >
                              TROCAR
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-[10px] font-bold bg-green-700 text-white hover:bg-green-800 rounded-lg shadow-sm"
                              onClick={() => onConfirm?.(slot.id)}
                            >
                              CONFIRMAR
                            </Button>
                          </div>
                        )}

                        {slot.isSwapRequested && !slot.isMine && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-[10px] font-bold bg-green-700 text-white hover:bg-green-800 shadow-sm rounded-full transition-all active:scale-95"
                            onClick={() => onTakeSwap?.(slot.id)}
                          >
                            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                            Assumir Troca
                          </Button>
                        )}

                        {slot.isMine && slot.isSwapRequested && (
                          <Badge variant="outline" className="text-[9px] font-black bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                            TROCA SOLICITADA
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
