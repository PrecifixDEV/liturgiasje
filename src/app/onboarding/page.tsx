"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { memberService, Member } from "@/services/memberService"
import { userService } from "@/services/userService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, UserPlus } from "lucide-react"
import { toast } from "sonner"

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirecionar se já tiver perfil ou não estiver logado
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/")
      } else if (profile) {
        router.push("/")
      }
    }
  }, [user, profile, loading])

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    setIsSearching(true)
    try {
      const results = await memberService.search(searchTerm)
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const handleClaim = async (member: Member) => {
    if (!user) return
    setIsSubmitting(true)
    try {
      // 1. Vincular na tabela members
      await memberService.claim(member.id, user.id)
      
      // 2. Criar perfil em public.users
      await userService.createProfile({
        id: user.id,
        email: user.email!,
        full_name: member.full_name,
        whatsapp: member.whatsapp,
        role: 'reader', // Padrão
        claimed_at: new Date().toISOString()
      })
      
      toast.success("Perfil vinculado com sucesso!")
      await refreshProfile()
      router.push("/profile")
    } catch (error) {
      toast.error("Erro ao vincular perfil.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateNew = async () => {
    if (!user) return
    setIsSubmitting(true)
    try {
      await userService.createProfile({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata.full_name || "",
        role: 'reader',
        is_self_registered: true
      })
      
      toast.success("Perfil criado!")
      await refreshProfile()
      router.push("/profile")
    } catch (error) {
      toast.error("Erro ao criar perfil.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || isSubmitting) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <Loader2 className="h-8 w-8 animate-spin text-stone-300" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50/50 px-4 py-12">
      <div className="mx-auto max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 font-heading">Bem-vindo!</h1>
          <p className="text-stone-500 text-sm">Para continuar, precisamos vincular seu acesso ao seu cadastro de leitor.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Busque seu nome na lista</label>
            <div className="flex gap-2">
              <Input 
                placeholder="Ex: João Silva" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="rounded-xl border-stone-200 focus-visible:ring-stone-200"
              />
              <Button onClick={handleSearch} disabled={isSearching} className="rounded-xl bg-stone-800 hover:bg-black">
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {searchResults.length > 0 ? (
              searchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleClaim(m)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-stone-100 bg-stone-50/50 hover:bg-stone-100 transition-colors text-left"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-stone-800">{m.full_name}</p>
                    <p className="text-[10px] text-stone-500">{m.whatsapp || "WhatsApp não cadastrado"}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-white px-2 py-1 rounded-md border border-stone-100">Este sou eu</span>
                </button>
              ))
            ) : searchTerm && !isSearching ? (
              <p className="text-center text-xs text-stone-400 py-4">Nenhum resultado encontrado.</p>
            ) : null}
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-100" /></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-stone-400">
              <span className="bg-white px-2 italic">ou</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            onClick={handleCreateNew}
            className="w-full rounded-xl border border-stone-100 h-12 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Não estou na lista, criar novo cadastro
          </Button>
        </div>
      </div>
    </div>
  )
}
