"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { User as UserIcon, X, Calendar as CalendarIcon, Clock, CheckCircle2, Cake as CakeIcon } from "lucide-react"
import { scheduleService } from "@/services/scheduleService"
import { supabase } from "@/lib/supabase"
import { format, isPast, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface UserAvatarLightboxProps {
  memberId?: string
  name: string
  avatarUrl?: string
  children: React.ReactNode
}

export function UserAvatarLightbox({ memberId, name, avatarUrl, children }: UserAvatarLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scales, setScales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [birthDate, setBirthDate] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && memberId) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          // Buscar escalas
          const scalesData = await scheduleService.listForMemberThisMonth(memberId)
          setScales(scalesData)

          // Buscar dados do membro e seu aniversário (que fica na tabela users)
          if (memberId) {
            const { data: memberData, error: memberError } = await supabase
              .from('members')
              .select('claimed_by, user:users!claimed_by(birth_date)')
              .eq('id', memberId)
              .maybeSingle()
            
            if (memberError) {
              console.warn("Erro ao buscar aniversário:", memberError.message)
            } else {
              const bDate = (memberData as any)?.user?.birth_date
              if (bDate) {
                setBirthDate(bDate)
              }
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do perfil:", error)
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }, [isOpen, memberId])

  if (!avatarUrl && !memberId) return <>{children}</>

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      "C": "Comentarista",
      "1L": "1ª Leitura",
      "2L": "2ª Leitura",
      "P": "Preces",
      "L": "Leitura"
    }
    return roles[role] || role
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="focus:outline-none transition-transform active:scale-95 text-left border-none bg-transparent p-0">
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-md p-0 border-none bg-stone-50 rounded-3xl shadow-2xl overflow-hidden focus:outline-none">
        
        {/* Header/Topo com Nome */}
        <div className="bg-white p-4 pt-6 text-center border-b border-stone-100">
           <h3 className="text-[#4e342e] font-black text-2xl tracking-tight leading-tight">{name}</h3>
           <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-0.5">Perfil do Leitor</p>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Foto Principal */}
          <div className="relative group w-full aspect-square max-w-[220px] mx-auto">
            <div className="w-full h-full rounded-3xl overflow-hidden border-4 border-white shadow-md bg-stone-100">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className="w-full h-full object-cover animate-in zoom-in-95 duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100">
                  <UserIcon className="h-16 w-16 text-stone-300" />
                </div>
              )}
            </div>
          </div>

          {/* Seção de Aniversário */}
          {birthDate && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-700">
                <CakeIcon className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700/60">Aniversário</span>
                <span className="text-sm font-bold text-[#4e342e]">
                  {format(parseISO(birthDate), "dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}

          {/* Seção de Escalas */}
          {memberId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-[#4e342e]/60">Escalas deste mês</h4>
                <CalendarIcon className="h-3.5 w-3.5 text-stone-400" />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-5 w-5 border-2 border-stone-300 border-t-[#4e342e] rounded-full animate-spin" />
                </div>
              ) : scales.length > 0 ? (
                <div className="max-h-[290px] overflow-y-auto pr-1 -mr-1 custom-scrollbar space-y-1.5">
                  {scales.map((slot) => {
                    const massDate = parseISO(slot.mass.date)
                    const isDone = isPast(massDate) && !format(massDate, 'yyyy-MM-dd').includes(format(new Date(), 'yyyy-MM-dd'))
                    
                    return (
                      <div 
                        key={slot.id} 
                        className={cn(
                          "flex items-center justify-between p-2.5 px-4 rounded-2xl border transition-all",
                          isDone ? "bg-stone-50/50 border-stone-100" : "bg-white border-stone-200 shadow-sm"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-tight text-[#4e342e]/60">
                            {getRoleName(slot.role)}
                          </span>
                          <span className="text-[16px] font-black text-[#4e342e]">
                            {format(massDate, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <div className="flex items-center gap-1.5 text-[13px] text-stone-400 font-bold">
                            <Clock className="h-3.5 w-3.5" /> {slot.mass.time.substring(0, 5)}
                          </div>
                        </div>

                        {isDone ? (
                          <div className="bg-green-50 text-green-600 p-1 rounded-full border border-green-100 shrink-0">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border border-amber-100 shrink-0">
                            Próxima
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-[10px] text-stone-400 italic py-4">
                  Nenhuma escala encontrada para este mês.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-stone-100">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-stone-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-colors"
          >
            Fechar Perfil
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
