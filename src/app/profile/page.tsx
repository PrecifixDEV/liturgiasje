"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { userService } from "@/services/userService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, Save, User as UserIcon, Calendar, MessageSquare, Clock } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/Header"
import { maskPhone, cn } from "@/lib/utils"
import { ProfileImageEditor } from "@/components/profile/ProfileImageEditor"
import { Badge } from "@/components/ui/badge"

const COMMON_TIMES = ["07:00", "09:00", "11:00", "19:00"]

export default function ProfilePage() {
  const { user, profile, isMember, loading, signInWithGoogle, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDay] = useState(6) // Fixo Domingo
  const [formData, setFormData] = useState({
    full_name: "",
    whatsapp: "",
    birth_date: "",
    preferences: {
      day_preferences: {} as Record<number, string[]>
    }
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    } else if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        whatsapp: profile.whatsapp || "",
        birth_date: profile.birth_date || "",
        preferences: profile.preferences || { day_preferences: {} }
      })
    }
  }, [user, profile, loading])

  const toggleTimePreference = (dayIndex: number, time: string) => {
    setFormData(prev => {
      const dayPrefs = prev.preferences?.day_preferences || {}
      const currentTimes = dayPrefs[dayIndex] || []
      const nextTimes = currentTimes.includes(time)
        ? currentTimes.filter(t => t !== time)
        : [...currentTimes, time]
      
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          day_preferences: {
            ...dayPrefs,
            [dayIndex]: nextTimes
          }
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    try {
      await userService.updateProfile(user.id, formData)
      toast.success("Perfil atualizado com sucesso!")
      await refreshProfile()
      router.push("/")
    } catch (error) {
      toast.error("Erro ao atualizar perfil.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const headerUser = profile ? {
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role
  } : null

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-stone-300" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50/30">
      <Header 
        user={headerUser} 
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />

      <main className="flex-1 overflow-auto">
        <div className="container max-w-md mx-auto px-4 py-8 space-y-8 pb-20">
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-stone-800">Meu Perfil</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-6">
              
              <div className="flex flex-col items-center py-4">
                <ProfileImageEditor />
                {profile?.role === "admin" && (
                  <div className="mt-4">
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 font-black text-[10px] tracking-wider px-4 py-1.5 rounded-full uppercase shadow-sm">
                      Administrador
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-400">
                    <UserIcon className="h-3 w-3" />
                    <label className="text-[10px] font-bold uppercase tracking-widest">Nome e Sobrenome</label>
                  </div>
                  <Input 
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Seu nome"
                    className="rounded-2xl border-stone-100 focus-visible:ring-stone-200 h-12 text-stone-800 font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-400">
                    <MessageSquare className="h-3 w-3" />
                    <label className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</label>
                  </div>
                  <Input 
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    className="rounded-2xl border-stone-100 focus-visible:ring-stone-200 h-12 text-stone-800 font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Calendar className="h-3 w-3" />
                    <label className="text-[10px] font-bold uppercase tracking-widest">Data de Nascimento</label>
                  </div>
                  <Input 
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="rounded-2xl border-stone-100 focus-visible:ring-stone-200 h-12 text-stone-800 font-medium"
                  />
                </div>

                <div className="space-y-6 pt-2">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Clock className="h-3 w-3" />
                    <label className="text-[10px] font-bold uppercase tracking-widest">Horários de Preferência (Domingo)</label>
                  </div>

                  <div className="space-y-6">
                    {/* Chips de Horários para o domingo */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {COMMON_TIMES.map((time) => {
                          const isSelected = formData.preferences?.day_preferences?.[selectedDay]?.includes(time)
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => toggleTimePreference(selectedDay, time)}
                              className={cn(
                                "flex items-center justify-center h-12 px-4 rounded-2xl border text-sm font-bold transition-all",
                                isSelected 
                                  ? "bg-stone-800 border-stone-800 text-white shadow-md" 
                                  : "bg-white border-stone-100 text-stone-500 hover:border-stone-200"
                              )}
                            >
                              {time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-stone-800 hover:bg-black text-white font-bold shadow-lg shadow-stone-200"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                  Salvar Alterações
                </Button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-800">Status de Membro</h3>
                  <p className="text-[11px] text-stone-500">
                    {isMember 
                      ? "Você está vinculado à lista oficial de membros." 
                      : "Seu perfil ainda não está vinculado à lista de membros."}
                  </p>
                </div>
                {isMember ? (
                  <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100 border-none!">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Ativo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full border border-amber-100 border-none!">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pendente</span>
                  </div>
                )}
              </div>

              {!isMember && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/onboarding")}
                  className="w-full rounded-2xl border-stone-100 text-stone-600 text-[10px] font-bold h-11 hover:bg-stone-50"
                >
                  <UserIcon className="h-3 w-3 mr-2 text-stone-400" />
                  Vincular meu nome à lista
                </Button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-stone-100/50 border border-stone-200/50">
              <p className="text-[10px] text-stone-500 text-center uppercase tracking-widest font-bold">
                Logado como: {user.email}
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
