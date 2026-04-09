"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { memberService, Member } from "@/services/memberService"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Plus, ArrowLeft, Trash2, Edit2, Search, UserCircle } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/Header"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MemberForm } from "@/components/MemberForm"
import { Input } from "@/components/ui/input"

export default function AdminMembersPage() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Verificar se é admin
  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== 'admin') {
        router.push("/")
      } else {
        loadMembers()
      }
    }
  }, [user, profile, loading])

  const loadMembers = async () => {
    try {
      setIsLoading(true)
      const data = await memberService.listAll()
      setMembers(data)
    } catch (error) {
      toast.error("Erro ao carregar membros.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este membro?")) return
    try {
      await memberService.delete(id)
      toast.success("Membro excluído.")
      loadMembers()
    } catch (error) {
      toast.error("Erro ao excluir membro.")
    }
  }

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.whatsapp?.includes(searchTerm)
  )

  const headerUser = profile ? {
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role
  } : null

  if (loading || (user && !profile)) {
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
        <div className="container max-w-md mx-auto px-4 py-6 space-y-6 pb-20">
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-8 w-8 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold text-stone-800">Gestão de Membros</h1>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input 
                  placeholder="Buscar membro..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl border-stone-200"
                />
              </div>
              <Button onClick={() => {
                setEditingMember(null)
                setIsSheetOpen(true)
              }} className="rounded-xl bg-stone-800 hover:bg-black">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-stone-300" />
                </div>
              ) : filteredMembers.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-10">Nenhum membro encontrado.</p>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.id} className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="h-10 w-10 shrink-0 border border-stone-100">
                        <AvatarImage src={member.claimed_user?.avatar_url || undefined} />
                        <AvatarFallback className="bg-stone-50 text-stone-300">
                          <UserCircle className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-stone-800 truncate">{member.full_name}</p>
                          {member.is_claimed && (
                            <span className="text-[8px] font-bold uppercase tracking-wider bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100 shrink-0">
                              No App
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 truncate">{member.whatsapp || "Sem WhatsApp"}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => {
                        setEditingMember(member)
                        setIsSheetOpen(true)
                      }} className="h-8 w-8 text-stone-400 hover:text-stone-800">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)} className="h-8 w-8 text-stone-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-[90%] sm:max-w-xl p-6">
          <SheetHeader>
            <SheetTitle className="text-stone-800">
              {editingMember ? "Editar Membro" : "Novo Membro"}
            </SheetTitle>
          </SheetHeader>
          <MemberForm 
            initialData={editingMember ? { full_name: editingMember.full_name, whatsapp: editingMember.whatsapp } : undefined}
            onSave={async (data) => {
              try {
                if (editingMember) {
                  await memberService.update(editingMember.id, data)
                  toast.success("Membro atualizado!")
                } else {
                  await memberService.create(data)
                  toast.success("Membro cadastrado!")
                }
                loadMembers()
                setIsSheetOpen(false)
              } catch (error) {
                toast.error("Erro ao salvar membro.")
              }
            }}
            onClose={() => setIsSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
