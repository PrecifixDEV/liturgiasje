"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { memberService, Member } from "@/services/memberService"
import { scheduleService } from "@/services/scheduleService"
import { unavailableService } from "@/services/unavailableService"
import { Plus, Search, Trash2, Calendar, Clock, Type, CheckCircle2, User, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ScheduleFormProps {
  currentMonth: Date
  onSuccess: () => void
  onClose: () => void
  initialData?: any
}

interface Slot {
  id: string
  roleType: "C" | "L" | "P"
  roleLabel: string
  memberId: string
  memberName: string
  isOpen: boolean
}

interface Session {
  dbId?: string
  tempId: string
  time: string
  description: string
  slots: Slot[]
}

export function ScheduleForm({ currentMonth, onSuccess, onClose, initialData }: ScheduleFormProps) {
  const [date, setDate] = useState("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [unavailableUserIds, setUnavailableUserIds] = useState<string[]>([])

  const monthRef = format(currentMonth, "yyyy-MM")

  const createEmptySession = (): Session => ({
    tempId: Math.random().toString(36).substring(2, 9),
    time: "",
    description: "",
    slots: []
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (date) {
      loadUnavailableForDate(date)
    }
  }, [date])

  const loadUnavailableForDate = async (d: string) => {
    try {
      const ids = await unavailableService.listManyByDate(d)
      setUnavailableUserIds(ids)
    } catch (error) {
      console.error("Erro ao carregar indisponibilidades:", error)
    }
  }

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setDate(initialData[0].date)
      
      const mappedSessions = initialData.map((item: any) => {
        const mappedSlots = item.slots.map((s: any) => {
          let roleType: "C" | "L" | "P" = "L"
          if (s.role.includes('C')) roleType = "C"
          else if (s.role.includes('P')) roleType = "P"

          return {
            id: s.id,
            roleType,
            roleLabel: s.role,
            memberId: s.member_id || s.memberId,
            memberName: s.reader_name || s.memberName || s.reader?.full_name,
            isOpen: false
          }
        })

        return {
          dbId: item.id,
          tempId: Math.random().toString(36).substring(2, 9),
          time: item.time?.substring(0, 5) || "",
          description: item.special_description || item.specialTitle || "",
          slots: mappedSlots
        }
      })
      setSessions(mappedSessions)
    } else {
      setSessions([createEmptySession()])
    }
  }, [initialData])

  const loadInitialData = async () => {
    try {
      const [membersList, counts] = await Promise.all([
        memberService.listAll(),
        scheduleService.getMembersUsage(monthRef)
      ])
      setMembers(membersList)
      setUsageCounts(counts)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }

  const updateRoleLabels = (currentSlots: Slot[]) => {
    const counts = { C: 0, L: 0, P: 0 }
    currentSlots.forEach(s => counts[s.roleType]++)

    return currentSlots.map(s => {
      const sameTypeSlots = currentSlots.filter(prev => prev.roleType === s.roleType)
      if (counts[s.roleType] <= 1) {
        return { ...s, roleLabel: s.roleType }
      }
      const index = sameTypeSlots.findIndex(prev => prev.id === s.id) + 1
      return { ...s, roleLabel: `${index}${s.roleType}` }
    })
  }

  const checkPreference = (member: Member, massTime: string, massDate: string) => {
    if (!member.claimed_user?.preferences?.day_preferences) return false
    
    // Obter dia da semana (0-6, 0 é domingo)
    try {
      const dateObj = new Date(massDate + 'T00:00:00')
      const dayOfWeek = dateObj.getDay()
      
      // O app usa "6" para Domingo nas preferências do perfil
      const dayKey = dayOfWeek === 0 ? "6" : dayOfWeek.toString()
      
      const prefs = member.claimed_user.preferences.day_preferences[dayKey]
      return Array.isArray(prefs) && (prefs.includes(massTime) || prefs.includes(massTime.substring(0, 5)))
    } catch {
      return false
    }
  }

  const addSession = () => {
    setSessions([...sessions, createEmptySession()])
  }

  const removeSession = async (tempId: string, dbId?: string) => {
    if (dbId) {
      if (!confirm("Deseja realmente excluir este horário permanentemente?")) return
      try {
        await scheduleService.deleteMass(dbId)
        toast.success("Horário excluído do banco de dados.")
      } catch (error) {
        toast.error("Erro ao excluir horário.")
        return
      }
    }
    setSessions(sessions.filter(s => s.tempId !== tempId))
  }

  const updateSessionField = (tempId: string, field: keyof Session, value: any) => {
    setSessions(sessions.map(s => s.tempId === tempId ? { ...s, [field]: value } : s))
  }

  const addSlot = (sessionTempId: string, roleType: "C" | "L" | "P") => {
    const newSlot: Slot = {
      id: Math.random().toString(36).substr(2, 9),
      roleType,
      roleLabel: "",
      memberId: "",
      memberName: "",
      isOpen: false
    }
    setSessions(sessions.map(sess => {
      if (sess.tempId === sessionTempId) {
        const updatedSlots = [...sess.slots, newSlot]
        return { ...sess, slots: updateRoleLabels(updatedSlots) }
      }
      return sess
    }))
  }

  const removeSlot = (sessionTempId: string, slotId: string) => {
    setSessions(sessions.map(sess => {
      if (sess.tempId === sessionTempId) {
        const updatedSlots = sess.slots.filter(s => s.id !== slotId)
        return { ...sess, slots: updateRoleLabels(updatedSlots) }
      }
      return sess
    }))
  }

  const updateSlotMember = (sessionTempId: string, slotId: string, member: Member) => {
    setSessions(sessions.map(sess => {
      if (sess.tempId === sessionTempId) {
        const updatedSlots = sess.slots.map(s => 
          s.id === slotId ? { ...s, memberId: member.id, memberName: member.full_name, isOpen: false } : s
        )
        return { ...sess, slots: updatedSlots }
      }
      return sess
    }))
  }

  const setSlotPopoverOpen = (sessionTempId: string, slotId: string, isOpen: boolean) => {
    setSessions(sessions.map(sess => {
      if (sess.tempId === sessionTempId) {
        const updatedSlots = sess.slots.map(s => 
          s.id === slotId ? { ...s, isOpen } : s
        )
        return { ...sess, slots: updatedSlots }
      }
      return sess
    }))
  }

  const handleSaveMass = async () => {
    if (!date) {
      toast.error("Preencha a data")
      return
    }

    // Validações
    for (const sess of sessions) {
      if (!sess.time) {
        toast.error("Preencha o horário de todas as missas")
        return
      }
      
      // Se houver slots adicionados, eles precisam ter um leitor selecionado
      const unassigned = sess.slots.find(s => !s.memberId)
      if (unassigned) {
        toast.error(`Escolha um leitor para ${unassigned.roleLabel} na missa das ${sess.time}`)
        return
      }
    }

    setIsSaving(true)
    try {
      // Salva cada sessão sequencialmente
      for (const sess of sessions) {
        const massData = {
          date,
          time: `${sess.time}:00`,
          special_description: sess.description,
          month_reference: monthRef
        }
        
        const slotsData = sess.slots.map(s => ({
          role: s.roleLabel,
          member_id: s.memberId
        }))

        if (sess.dbId) {
          await scheduleService.updateMass(sess.dbId, massData, slotsData)
        } else {
          await scheduleService.createMassWithSlots(massData, slotsData)
        }
      }

      toast.success("Escala salva com sucesso!")
      onSuccess()
      onClose()
    } catch (error) {
      toast.error("Erro ao salvar escala. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-stone-50/50">
      {/* Área de Conteúdo com Scroll */}
      <div className="flex-1 overflow-y-auto space-y-4 px-6 pt-1 pb-8">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Campo de Data (único para o card) */}
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Data da Escala</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-white border-stone-200"
              />
            </div>
          </div>

          <div className="h-px bg-stone-100 mt-1" />

          {/* Lista de Sessões (Horários) */}
          {sessions.map((sess, sessIndex) => (
            <div key={sess.tempId} className="space-y-3 p-4 rounded-2xl border border-stone-200 bg-white relative shadow-sm">
              
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest">
                  Horário #{sessIndex + 1}
                </span>
                {sessions.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                    onClick={() => removeSession(sess.tempId, sess.dbId)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Excluir
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Horário</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <Input 
                      type="time" 
                      value={sess.time}
                      onChange={(e) => updateSessionField(sess.tempId, 'time', e.target.value)}
                      className="pl-10 h-10 rounded-xl bg-stone-50/50"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Descrição</Label>
                  <div className="relative">
                    <Type className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <Input 
                      placeholder="" 
                      value={sess.description}
                      onChange={(e) => updateSessionField(sess.tempId, 'description', e.target.value)}
                      className="pl-10 h-10 rounded-xl bg-stone-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Lista de Slots da Sessão */}
              <div className="space-y-1.5 pt-1">
                {sess.slots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-black text-[10px] border border-amber-200">
                      {slot.roleLabel}
                    </div>
                    
                    <div className="flex-1">
                      <Popover open={slot.isOpen} onOpenChange={(open) => setSlotPopoverOpen(sess.tempId, slot.id, open)}>
                        <PopoverTrigger render={
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-8 justify-between font-bold rounded-lg border-stone-200 bg-white px-2",
                              !slot.memberId && "text-stone-400 font-normal"
                            )}
                          >
                            <div className="flex items-center truncate">
                              <User className="mr-2 h-3.5 w-3.5 text-stone-400 shrink-0" />
                              <span className="truncate text-[11px]">
                                {slot.memberId ? slot.memberName : "Selecionar..."}
                              </span>
                            </div>
                            <Search className="ml-2 h-3 w-3 opacity-50 shrink-0" />
                          </Button>
                        } />
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Pesquisar leitor..." 
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                              autoFocus
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum leitor encontrado.</CommandEmpty>
                              <CommandGroup>
                                {(() => {
                                  const sortedMembers = [...members].sort((a, b) => {
                                    const prefA = checkPreference(a, sess.time, date) ? 1 : 0
                                    const prefB = checkPreference(b, sess.time, date) ? 1 : 0
                                    if (prefA !== prefB) return prefB - prefA

                                    const unA = a.claimed_by && unavailableUserIds.includes(a.claimed_by) ? 1 : 0
                                    const unB = b.claimed_by && unavailableUserIds.includes(b.claimed_by) ? 1 : 0
                                    if (unA !== unB) return unA - unB

                                    return a.full_name.localeCompare(b.full_name)
                                  })

                                  return sortedMembers.map((member) => {
                                    const isUnavailable = member.claimed_by ? unavailableUserIds.includes(member.claimed_by) : false
                                    const isPreference = checkPreference(member, sess.time, date)
                                    
                                    return (
                                      <CommandItem
                                        key={member.id}
                                        value={member.full_name}
                                        onSelect={() => {
                                          if (isUnavailable) {
                                            toast.warning(`${member.full_name} informou que não poderá participar nesta data.`, {
                                              duration: 5000,
                                              icon: <AlertCircle className="h-4 w-4 text-amber-600" />
                                            })
                                          }
                                          updateSlotMember(sess.tempId, slot.id, member)
                                          setSearchTerm("")
                                        }}
                                        className="flex items-center justify-between"
                                      >
                                        <span className={cn(
                                          "font-medium transition-colors",
                                          isUnavailable && "text-red-500 font-bold",
                                          isPreference && !isUnavailable && "text-green-600 font-bold"
                                        )}>
                                          {member.full_name}
                                          {isUnavailable && " (Indisponível)"}
                                          {isPreference && !isUnavailable && " (Preferência)"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          {usageCounts[member.id] > 0 && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md">
                                              {usageCounts[member.id]}x
                                            </span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    )
                                  })
                                })()}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-stone-300 hover:text-red-500 rounded-lg"
                      onClick={() => removeSlot(sess.tempId, slot.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Botão de Adicionar Leitura (Dentro da Sessão) */}
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" size="sm" className="h-7 px-3 font-bold text-[9px] uppercase tracking-wider rounded-lg border-stone-200 text-stone-500 hover:bg-stone-50">
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar Leitura
                  </Button>
                } />
                <DropdownMenuContent align="start" className="rounded-xl p-1.5">
                  <DropdownMenuItem onClick={() => addSlot(sess.tempId, "C")} className="font-bold text-xs text-stone-700">Comentarista (C)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSlot(sess.tempId, "L")} className="font-bold text-xs text-stone-700">Leitor (L)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSlot(sess.tempId, "P")} className="font-bold text-xs text-stone-700">Preces (P)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          ))}

          {/* Botão de Adicionar outro Horário */}
          <div className="pt-1">
            <Button 
              variant="outline" 
              onClick={addSession}
              className="w-full h-10 border-dashed border-stone-300 text-stone-500 font-bold rounded-xl hover:bg-stone-100 transition-all text-xs"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar outro Horário
            </Button>
          </div>

        </div>
      </div>

      {/* Rodapé Fixo (Sticky) */}
      <div className="shrink-0 bg-white border-t border-stone-200 p-4 pb-5 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-50">
        <Button 
          disabled={isSaving || !date || sessions.some(s => !s.time || s.slots.some(slot => !slot.memberId))}
          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-black tracking-widest uppercase text-[10px] rounded-xl shadow-xl shadow-green-200/50 transition-all active:scale-95 disabled:opacity-50"
          onClick={handleSaveMass}
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Salvar Escala do Dia
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
