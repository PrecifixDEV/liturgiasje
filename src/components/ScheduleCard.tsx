"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, RefreshCw, CheckCircle, UserPlus } from "lucide-react"

interface ReaderSlot {
  id: string
  role: "C" | "1L" | "2L" | "P" | "L"
  roleName: string
  readerName?: string
  originalReaderName?: string
  isConfirmed: boolean
  isSwapRequested: boolean
  isMine?: boolean
}

interface ScheduleCardProps {
  id: string
  date: string
  time: string
  specialTitle?: string
  externalGroup?: string
  slots: ReaderSlot[]
  onConfirm?: (slotId: string) => void
  onRequestSwap?: (slotId: string) => void
  onTakeSwap?: (slotId: string) => void
}

export function ScheduleCard({
  id,
  date,
  time,
  specialTitle,
  externalGroup,
  slots,
  onConfirm,
  onRequestSwap,
  onTakeSwap,
}: ScheduleCardProps) {
  if (externalGroup) {
    return (
      <Card className="border-stone-200 bg-stone-50/50">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-stone-600">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-semibold">{date}</span>
              <Clock className="ml-1 h-4 w-4" />
              <span className="text-sm whitespace-nowrap">{time}</span>
            </div>
            {specialTitle && (
              <Badge variant="outline" className="text-[10px] uppercase border-amber-200 text-amber-700 bg-amber-50">
                {specialTitle}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm font-medium italic text-stone-500">
            Responsabilidade: <span className="font-bold text-stone-800">{externalGroup}</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-stone-200 bg-white/50 shadow-sm">
      <CardHeader className="bg-stone-50/50 p-4 pb-3 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-stone-700">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-tight">{date}</span>
            <Clock className="ml-1 h-4 w-4" />
            <span className="text-sm font-semibold tracking-tight">{time}</span>
          </div>
          {specialTitle && (
            <Badge variant="outline" className="text-[10px] uppercase border-stone-300 text-stone-600">
              {specialTitle}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-stone-100">
        {slots.map((slot) => (
          <div key={slot.id} className="flex flex-col px-4 py-3 space-y-1">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {/* Role Icon - Substituído por RefreshCw se houver troca */}
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold border transition-all ${
                  slot.isSwapRequested 
                    ? "bg-amber-100 text-amber-700 border-amber-200 animate-pulse ring-2 ring-amber-100 ring-offset-1" 
                    : "bg-stone-100 text-stone-600 border-stone-200"
                }`}>
                  {slot.isSwapRequested ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    slot.role
                  )}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-stone-400 capitalize -mb-0.5">{slot.roleName}</span>
                  <span className="text-sm font-semibold text-stone-800 leading-tight">
                    {slot.readerName || "---"}
                    {slot.originalReaderName && slot.readerName !== slot.originalReaderName && (
                      <span className="inline-block ml-1.5 text-[10px] font-normal text-stone-500">
                        (substituiu {slot.originalReaderName})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Ações e Status */}
              <div className="flex items-center gap-2">
                {slot.isConfirmed && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
                
                {/* Botão de Troca (Apenas para o dono da escala) */}
                {slot.isMine && !slot.isSwapRequested && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-stone-400 hover:text-amber-600 hover:bg-amber-50"
                    onClick={() => onRequestSwap?.(slot.id)}
                    title="Solicitar Troca"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
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
              </div>
            </div>

            {/* Ações do Usuário Logado (Confirmar/Trocar) */}
            {slot.isMine && !slot.isConfirmed && !slot.isSwapRequested && (
              <div className="flex gap-2 w-full pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-8 text-[10px] font-bold bg-green-700 text-white hover:bg-green-800 rounded-lg"
                  onClick={() => onConfirm?.(slot.id)}
                >
                  Confirmar Leitura
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold border-stone-200 text-stone-500 hover:bg-stone-50 rounded-lg"
                  onClick={() => onRequestSwap?.(slot.id)}
                >
                  Trocar
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
