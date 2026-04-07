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

export default function Home() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  
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
      
      <main className="flex-1 overflow-auto">
        <div className="container max-w-md mx-auto px-4 py-6 space-y-8 pb-20">
          
          {/* Sessão 1: Mural de Recados */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                Mural de Recados
              </h2>
              
              {headerUser?.role === "admin" && (
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger render={<Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100" />}>
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar Recado
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-lg border-l-stone-100 p-6">
                    <SheetHeader>
                      <SheetTitle className="text-stone-800">Novo Aviso</SheetTitle>
                    </SheetHeader>
                    <AnnouncementForm 
                      onSave={async (data) => {
                        try {
                          await announcementService.create({ ...data, type: 'Aviso' })
                          toast.success("Aviso publicado com sucesso!")
                          loadAnnouncements()
                          setIsSheetOpen(false)
                        } catch (error) {
                          toast.error("Erro ao publicar aviso. Tente novamente.")
                          throw error
                        }
                      }}
                      onClose={() => setIsSheetOpen(false)}
                    />
                  </SheetContent>
                </Sheet>
              )}
            </div>
            
            <div className="space-y-3">
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
                    isAdmin={headerUser?.role === "admin"}
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
                  />
                ))
              )}
            </div>
          </section>

          {/* Sessão Interativa: Seletor de Mês */}
          <section className="flex flex-col items-center gap-4 py-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400">
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
                schedule.map((item) => (
                  <ScheduleCard 
                    key={item.id} 
                    id={item.id}
                    date={format(new Date(item.date + 'T00:00:00'), "dd 'de' MMMM - EEEE", { locale: ptBR })}
                    time={item.time.substring(0, 5)}
                    specialTitle={item.special_description}
                    externalGroup={item.external_group}
                    slots={item.slots.map((s: any) => ({
                      id: s.id,
                      role: s.role,
                      roleName: (({
                        'C': 'Comentarista',
                        '1L': '1ª Leitura',
                        '2L': '2ª Leitura',
                        'P': 'Preces',
                        'L': 'Leitura Única'
                      } as Record<string, string>)[s.role]) || s.role,
                      readerName: s.reader?.full_name,
                      originalReaderName: s.original_reader?.full_name,
                      isConfirmed: s.is_confirmed,
                      isSwapRequested: s.is_swap_requested,
                      isMine: s.reader_id === user?.id
                    }))}
                    onConfirm={async (slotId) => {
                      try {
                        await scheduleService.confirmSlot(slotId)
                        toast.success("Presença confirmada!")
                        loadSchedule()
                      } catch (error) {
                        toast.error("Erro ao confirmar.")
                      }
                    }}
                    onRequestSwap={async (slotId) => {
                      try {
                        await scheduleService.requestSwap(slotId)
                        toast.success("Troca solicitada!")
                        loadSchedule()
                      } catch (error) {
                        toast.error("Erro ao solicitar troca.")
                      }
                    }}
                  />
                ))
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
