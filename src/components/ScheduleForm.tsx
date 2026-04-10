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
import { Plus, Search, Trash2, Calendar, Clock, Type, CheckCircle2, User } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ScheduleFormProps {
  currentMonth: Date
  onSuccess: () => void
  onClose: () => void
}

interface Slot {
  id: string
  roleType: "C" | "L" | "P"
  roleLabel: string
  memberId: string
  memberName: string
  isOpen: boolean
}

export function ScheduleForm({ currentMonth, onSuccess, onClose }: ScheduleFormProps) {
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [description, setDescription] = useState("")
  const [slots, setSlots] = useState<Slot[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const monthRef = format(currentMonth, "yyyy-MM")

  useEffect(() => {
    loadInitialData()
  }, [])

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

  const addSlot = (roleType: "C" | "L" | "P") => {
    const newSlot: Slot = {
      id: Math.random().toString(36).substr(2, 9),
      roleType,
      roleLabel: "",
      memberId: "",
      memberName: "",
      isOpen: false
    }
    const updatedSlots = [...slots, newSlot]
    setSlots(updateRoleLabels(updatedSlots))
  }

  const removeSlot = (id: string) => {
    const updatedSlots = slots.filter(s => s.id !== id)
    setSlots(updateRoleLabels(updatedSlots))
  }

  const updateSlotMember = (slotId: string, member: Member) => {
    const updatedSlots = slots.map(s => 
      s.id === slotId ? { ...s, memberId: member.id, memberName: member.full_name, isOpen: false } : s
    )
    setSlots(updatedSlots)
  }

  const setSlotPopoverOpen = (slotId: string, isOpen: boolean) => {
    const updatedSlots = slots.map(s => 
      s.id === slotId ? { ...s, isOpen } : s
    )
    setSlots(updatedSlots)
  }

  const handleSaveMass = async () => {
    if (!date || !time) {
      toast.error("Preencha data e horário")
      return
    }

    if (slots.length === 0) {
      toast.error("Adicione pelo menos um leitor")
      return
    }

    const unassignedSlot = slots.find(s => !s.memberId)
    if (unassignedSlot) {
      toast.error(`Escolha um leitor para ${unassignedSlot.roleLabel}`)
      return
    }

    setIsSaving(true)
    try {
      await scheduleService.createMassWithSlots({
        date,
        time: `${time}:00`,
        special_description: description,
        month_reference: monthRef
      }, slots.map(s => ({
        role: s.roleLabel,
        member_id: s.memberId
      })))

      toast.success("Missa salva com sucesso!")
      onSuccess()
      onClose() // Fecha o Sheet após salvar
    } catch (error) {
      toast.error("Erro ao salvar missa. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="flex-1 space-y-6 overflow-y-auto px-1 pb-20">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Data</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Horário</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-stone-400 ml-1">Descrição / Título (Opcional)</Label>
            <div className="relative">
              <Type className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input 
                placeholder="Ex: Missa de Ramos, Com Crianças..." 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pl-10 h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="h-px bg-stone-100 my-2" />

          {/* Lista de Slots */}
          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-black text-sm border border-amber-200 shadow-sm">
                  {slot.roleLabel}
                </div>
                
                <div className="flex-1">
                  <Popover open={slot.isOpen} onOpenChange={(open) => setSlotPopoverOpen(slot.id, open)}>
                    <PopoverTrigger render={
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-10 justify-between font-bold rounded-xl border-stone-200",
                          !slot.memberId && "text-stone-400 font-normal"
                        )}
                      >
                        <div className="flex items-center truncate">
                          <User className="mr-2 h-4 w-4 text-stone-400 shrink-0" />
                          <span className="truncate">
                            {slot.memberId ? slot.memberName : "Selecionar Leitor..."}
                          </span>
                        </div>
                        <Search className="ml-2 h-3.5 w-3.5 opacity-50 shrink-0" />
                      </Button>
                    } />
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Pesquisar leitor..." 
                          value={searchTerm}
                          onValueChange={setSearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum leitor encontrado.</CommandEmpty>
                          <CommandGroup>
                            {members.map((member) => (
                              <CommandItem
                                key={member.id}
                                value={member.full_name}
                                onSelect={() => {
                                  updateSlotMember(slot.id, member)
                                  setSearchTerm("")
                                }}
                                className="flex items-center justify-between"
                              >
                                <span className="font-medium">{member.full_name}</span>
                                {usageCounts[member.id] > 0 && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-md border border-amber-200">
                                    {usageCounts[member.id]}x
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl shrink-0"
                  onClick={() => removeSlot(slot.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Botões +L e +Leitor */}
          <div className="flex items-center gap-2 pt-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="secondary" size="sm" className="h-9 px-3 font-black text-[11px] uppercase tracking-wider rounded-xl bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 transition-all">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Cargo (+L)
                </Button>
              } />
              <DropdownMenuContent align="start" className="rounded-xl p-1.5">
                <DropdownMenuItem 
                  onClick={() => addSlot("C")}
                  className="font-bold text-stone-700 rounded-lg"
                >
                  Comentarista (C)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => addSlot("L")}
                  className="font-bold text-stone-700 rounded-lg"
                >
                  Leitor (L)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => addSlot("P")}
                  className="font-bold text-stone-700 rounded-lg"
                >
                  Preces (P)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-stone-200 bg-white/50 backdrop-blur-md -mx-1 -mb-1 p-4 rounded-b-2xl">
        <Button 
          disabled={isSaving || !date || !time || slots.length === 0}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-black tracking-widest uppercase text-xs rounded-xl shadow-xl shadow-green-200/50 transition-all active:scale-95 disabled:opacity-50"
          onClick={handleSaveMass}
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Salvar Missa
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
