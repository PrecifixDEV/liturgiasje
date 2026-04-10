"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { AnnouncementCard } from "@/components/AnnouncementCard"
import { ScheduleCard } from "@/components/ScheduleCard"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react"
import { addMonths, format, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useAuth } from "@/hooks/useAuth"
import { AnnouncementForm } from "@/components/AnnouncementForm"
import { ScheduleForm } from "@/components/ScheduleForm"
import { announcementService } from "@/services/announcementService"
import { scheduleService } from "@/services/scheduleService"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

export default function Home() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  const [announcementToEdit, setAnnouncementToEdit] = useState<any | null>(null)
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false)
  const [scheduleToEdit, setScheduleToEdit] = useState<any | null>(null)
  const [scheduleToDelete, setScheduleToDelete] = useState<string[] | null>(null)
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false)
  const [swapTargetSlot, setSwapTargetSlot] = useState<any | null>(null)
  const [isRequestingSwap, setIsRequestingSwap] = useState(false)
  
  // Redirecionamento para Onboarding se não tiver perfil
  useEffect(() => {
    if (!loading && user && !profile) {
      router.push("/onboarding")
    }
  }, [user, profile, loading])

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const monthName = format(currentDate, "MMMM yyyy", { locale: ptBR })

  // 1. Carregar Avisos
  const loadAnnouncements = async () => {
    try {
      setIsLoadingAnnouncements(true)
      const data = await announcementService.list(user?.id)
      setAnnouncements(data)
    } finally {
      setIsLoadingAnnouncements(false)
    }
  }

  // 2. Carregar Escala
  const loadSchedule = async () => {
    try {
      setIsLoadingSchedule(true)
      const data = await scheduleService.listForMonth(currentDate)
      setSchedule(data)
    } finally {
      setIsLoadingSchedule(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()
  }, [user?.id])

  useEffect(() => {
    loadSchedule()
  }, [currentDate])

  const headerUser = profile ? {
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role
  } : null

  return (
    <div className="flex min-h-screen flex-col bg-stone-50/30">
      <Header 
        user={headerUser} 
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />
      
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-6 space-y-8">
          
          {/* Sessão 1: Mural de Recados */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-black uppercase tracking-widest text-stone-900">
                Mural de Recados
              </h2>
              
              {headerUser?.role === "admin" && (
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger render={<Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100" />}>
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar Recado
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-lg border-l-stone-100 p-6 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="text-stone-800">Novo Aviso</SheetTitle>
                    </SheetHeader>
                    <AnnouncementForm 
                      initialData={announcementToEdit}
                      onSave={async (data) => {
                        try {
                          if (data.id) {
                            // Atualização
                            await announcementService.update(data.id, {
                              title: data.title,
                              content: data.content,
                              expires_at: data.expires_at?.toISOString()
                            })
                            toast.success("Aviso atualizado!")
                          } else {
                            // Criação
                            await announcementService.create({ ...data, type: 'Aviso' })
                            toast.success("Aviso publicado com sucesso!")
                          }
                          loadAnnouncements()
                          setIsSheetOpen(false)
                          setAnnouncementToEdit(null)
                        } catch (error) {
                          toast.error("Erro ao salvar aviso. Tente novamente.")
                          throw error
                        }
                      }}
                      onClose={() => {
                        setIsSheetOpen(false)
                        setAnnouncementToEdit(null)
                      }}
                    />
                  </SheetContent>
                </Sheet>
              )}
            </div>
            
            <div className="space-y-2">
              {isLoadingAnnouncements ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-stone-300" />
                </div>
              ) : announcements.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-6">Nenhum aviso no momento.</p>
              ) : (
                announcements.map((ann) => (
                  <AnnouncementCard 
                    key={ann.id} 
                    {...ann} 
                    authorId={ann.created_by}
                    currentUserId={user?.id}
                    isAdmin={headerUser?.role === "admin"}
                    isLoggedIn={!!user}
                    onRead={async (id) => {
                      if (!user) {
                        toast.error("Faça login para marcar como lido.")
                        return
                      }
                      try {
                        await announcementService.markAsRead(id, user.id)
                        loadAnnouncements()
                      } catch (error) {
                        console.error(error)
                      }
                    }}
                    onUpdate={async (id, data) => {
                      try {
                        await announcementService.update(id, data)
                        toast.success("Aviso atualizado!")
                        loadAnnouncements()
                      } catch (error) {
                        toast.error("Erro ao atualizar aviso.")
                      }
                    }}
                    onDelete={(id) => setAnnouncementToDelete(id)}
                    onEdit={(ann) => {
                      setAnnouncementToEdit(ann)
                      setIsSheetOpen(true)
                    }}
                    onAcceptSwap={async (slotId, annId) => {
                      if (!user) {
                        toast.error("Faça login para aceitar trocas.")
                        return
                      }
                      try {
                        await scheduleService.acceptSwap(slotId, user.id)
                        toast.success("Troca aceita com sucesso!")
                        loadSchedule()
                        loadAnnouncements()
                      } catch (error) {
                        toast.error("Erro ao aceitar troca.")
                      }
                    }}
                  />
                ))
              )}
            </div>
          </section>

          {/* Drawer de Confirmação de Exclusão */}
          <Drawer open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader className="text-center">
                  <DrawerTitle className="text-stone-800">Excluir Recado?</DrawerTitle>
                  <DrawerDescription>
                    Esta ação não pode ser desfeita. O aviso será removido permanentemente.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter className="flex flex-col gap-2 pb-8">
                  <Button 
                    variant="destructive" 
                    className="w-full font-bold h-12 rounded-xl"
                    disabled={isDeleting}
                    onClick={async () => {
                      if (!announcementToDelete) return
                      setIsDeleting(true)
                      try {
                        await announcementService.delete(announcementToDelete)
                        toast.success("Aviso excluído.")
                        loadAnnouncements()
                        setAnnouncementToDelete(null)
                      } catch (error) {
                        toast.error("Erro ao excluir.")
                      } finally {
                        setIsDeleting(false)
                      }
                    }}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apagar"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="ghost" className="w-full text-stone-500 font-medium h-12">
                      Cancelar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Sessão Interativa: Seletor de Mês */}
          <section className="flex flex-col items-center gap-4 py-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-stone-900">
              Escala de Leitores
            </h2>
            <div className="flex items-center justify-between w-full bg-white rounded-full border border-stone-200 px-2 py-1.5 shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-stone-400 hover:text-stone-800"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <span className="text-sm font-bold text-stone-800 capitalize tracking-tight">
                {monthName}
              </span>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full text-stone-400 hover:text-stone-800"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </section>

          {/* Sessão 2: Escala do Mês */}
          <section className="space-y-4">
            <div className="space-y-4">
              {isLoadingSchedule ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-stone-300" />
                </div>
              ) : schedule.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-10">Não há missas cadastradas para este mês.</p>
              ) : (
                (() => {
                  const grouped = schedule.reduce((acc: any, item: any) => {
                    const dateKey = item.date;
                    if (!acc[dateKey]) {
                      acc[dateKey] = {
                        date: dateKey,
                        items: []
                      }
                    }
                    acc[dateKey].items.push(item)
                    return acc
                  }, {})

                  const sortedDays = Object.values(grouped).sort((a: any, b: any) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  )

                  return sortedDays.map((day: any) => (
                    <ScheduleCard 
                      key={day.date} 
                      date={format(new Date(day.date + 'T00:00:00'), "dd 'de' MMMM - EEEE", { locale: ptBR })}
                      items={day.items.map((item: any) => ({
                        id: item.id,
                        time: item.time.substring(0, 5),
                        specialTitle: item.special_description,
                        slots: item.slots.map((s: any) => ({
                          id: s.id,
                          role: s.role,
                          roleName: (({
                            'C': 'Comentarista',
                            '1L': '1ª Leitura',
                            '2L': '2ª Leitura',
                            'P': 'Preces',
                            'L': 'Leitura Única'
                          } as Record<string, string>)[s.role]) || s.role,
                          readerName: s.reader_name,
                          avatarUrl: s.avatar_url,
                          originalReaderName: s.original_reader?.full_name,
                          isConfirmed: s.is_confirmed,
                          isSwapRequested: s.is_swap_requested,
                          isMine: s.reader_id === user?.id
                        }))
                      }))}
                      isAdmin={headerUser?.role === "admin"}
                      onEdit={() => {
                        setScheduleToEdit(day.items) // Passa o array de missas do dia
                        setIsScheduleSheetOpen(true)
                      }}
                      onDelete={() => {
                        setScheduleToDelete(day.items.map((item: any) => item.id))
                      }}
                      onConfirm={async (slotId) => {
                        try {
                          await scheduleService.confirmSlot(slotId)
                          toast.success("Presença confirmada!")
                          loadSchedule()
                        } catch (error) {
                          toast.error("Erro ao confirmar.")
                        }
                      }}
                      onRequestSwap={(slotId) => {
                        // Encontrar detalhes da missa para o aviso
                        let targetMass: any = null;
                        let targetDay: any = null;
                        
                        schedule.forEach(mass => {
                          if (mass.slots.some((s: any) => s.id === slotId)) {
                            targetMass = mass;
                          }
                        });

                        if (targetMass) {
                          setSwapTargetSlot({
                            id: slotId,
                            massDate: format(new Date(targetMass.date + 'T00:00:00'), "dd/MM"),
                            massTime: targetMass.time.substring(0, 5),
                            description: targetMass.special_description || "Missa"
                          });
                        }
                      }}
                      onTakeSwap={async (slotId) => {
                        if (!user) return;
                        try {
                          await scheduleService.acceptSwap(slotId, user.id)
                          toast.success("Você assumiu esta escala!")
                          loadSchedule()
                          loadAnnouncements()
                        } catch (error) {
                          toast.error("Erro ao assumir troca.")
                        }
                      }}
                    />
                  ))
                })()
              )}
            </div>
            
            {headerUser?.role === "admin" && (
              <div className="pt-2">
                <Sheet open={isScheduleSheetOpen} onOpenChange={setIsScheduleSheetOpen}>
                  <SheetTrigger render={
                    <Button 
                      variant="outline" 
                      className="w-full h-14 border-dashed border-stone-300 text-stone-500 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 rounded-2xl group transition-all"
                    >
                      <Plus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Adicionar Missa
                    </Button>
                  } />
                  <SheetContent side="right" className="w-full sm:max-w-lg border-l-stone-100 p-0 flex flex-col">
                    <div className="px-6 pt-6 pb-2">
                      <SheetHeader className="mb-0">
                        <SheetTitle className="text-stone-800 uppercase tracking-tighter font-black text-xl">
                          {scheduleToEdit ? "Editar Escala" : `Escala de ${format(currentDate, "MMMM yyyy", { locale: ptBR })}`}
                        </SheetTitle>
                      </SheetHeader>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ScheduleForm 
                        currentMonth={currentDate}
                        initialData={scheduleToEdit}
                        onSuccess={() => {
                          loadSchedule()
                        }}
                        onClose={() => {
                          setIsScheduleSheetOpen(false)
                          setScheduleToEdit(null)
                        }}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </section>

          {/* Drawer de Confirmação de Exclusão de Escala */}
          <Drawer open={!!scheduleToDelete} onOpenChange={(open) => !open && setScheduleToDelete(null)}>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader className="text-center">
                  <DrawerTitle className="text-stone-800">Excluir Missa da Escala?</DrawerTitle>
                  <DrawerDescription>
                    Esta ação removerá a missa e todos os leitores escalados para este dia.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter className="flex flex-col gap-2 pb-8">
                  <Button 
                    variant="destructive" 
                    className="w-full font-bold h-12 rounded-xl"
                    disabled={isDeletingSchedule}
                    onClick={async () => {
                      if (!scheduleToDelete) return
                      setIsDeletingSchedule(true)
                      try {
                        // Exclui todos os horários vinculados ao card (dia)
                        await Promise.all(scheduleToDelete.map(id => scheduleService.deleteMass(id)))
                        toast.success("Dia removido da escala.")
                        loadSchedule()
                        setScheduleToDelete(null)
                      } catch (error) {
                        toast.error("Erro ao excluir horários do dia.")
                      } finally {
                        setIsDeletingSchedule(false)
                      }
                    }}
                  >
                    {isDeletingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apagar"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="ghost" className="w-full text-stone-500 font-medium h-12">
                      Cancelar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>

          {/* Drawer de Confirmação de Troca */}
          <Drawer open={!!swapTargetSlot} onOpenChange={(open) => !open && !isRequestingSwap && setSwapTargetSlot(null)}>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader className="text-center">
                  <DrawerTitle className="text-stone-800">Solicitar Troca?</DrawerTitle>
                  <DrawerDescription>
                    Um aviso será enviado ao Mural de Recados para que outro leitor possa assumir sua escala no dia {swapTargetSlot?.massDate} às {swapTargetSlot?.massTime}.
                  </DrawerDescription>
                </DrawerHeader>
                <DrawerFooter className="flex flex-col gap-2 pb-8">
                  <Button 
                    variant="default"
                    className="w-full font-bold h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={isRequestingSwap}
                    onClick={async () => {
                      if (!swapTargetSlot || !user) return
                      setIsRequestingSwap(true)
                      try {
                        await scheduleService.requestSwap(swapTargetSlot.id)
                        
                        // Criar o aviso
                        await announcementService.create({
                          title: "Solicitação de Troca",
                          content: `${profile?.full_name || 'Um leitor'} solicitou troca para a missa do dia ${swapTargetSlot.massDate} às ${swapTargetSlot.massTime} (${swapTargetSlot.description}). Quem puder assumir, clique em 'Aceitar Troca' abaixo.`,
                          type: 'Troca',
                          expires_at: null, // Opcional: expirar após a data da missa
                          related_schedule_slot_id: swapTargetSlot.id
                        } as any)

                        toast.success("Solicitação enviada ao Mural!")
                        loadSchedule()
                        loadAnnouncements()
                        setSwapTargetSlot(null)
                      } catch (error) {
                        toast.error("Erro ao processar solicitação.")
                      } finally {
                        setIsRequestingSwap(false)
                      }
                    }}
                  >
                    {isRequestingSwap ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Solicitação"}
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="ghost" className="w-full text-stone-500 font-medium h-12" disabled={isRequestingSwap}>
                      Cancelar
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>

        </div>
      </main>
    </div>
  )
}
