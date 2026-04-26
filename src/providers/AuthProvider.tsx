"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { userService, UserProfile } from "@/services/userService"
import { memberService } from "@/services/memberService"

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  member: any | null
  isMember: boolean
  loading: boolean
  refreshProfile: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [member, setMember] = useState<any | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const [profileData, memberData] = await Promise.all([
        userService.getProfile(userId),
        memberService.getByUserId(userId)
      ])
      setProfile(profileData)
      setMember(memberData)
      setIsMember(!!memberData)
    } catch (error) {
      console.error("Erro ao buscar perfil/membro:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true;

    // 1. Verificar usuário atual ao montar
    const checkInitialSession = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        
        if (isMounted) {
          setUser(user)
          if (user) {
            fetchProfile(user.id)
          } else {
            setLoading(false)
          }
        }
      } catch (error: any) {
        // Silenciar erro de lock que é comum em HMR/Dev
        if (!error.message?.includes('Lock broken')) {
          console.warn("Erro ao recuperar sessão inicial:", error.message)
        }
        if (isMounted) setLoading(false)
      }
    }

    checkInitialSession()
 
    // 2. Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) return
        
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (currentUser) {
          fetchProfile(currentUser.id)
        } else {
          setProfile(null)
          setMember(null)
          setIsMember(false)
          setLoading(false)
        }
      }
    )
 
    return () => {
      isMounted = false;
      subscription.unsubscribe()
    }
  }, [])

  // 3. Realtime para Perfil e Membro
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`profile-updates-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        () => fetchProfile(user.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `claimed_by=eq.${user.id}` },
        () => fetchProfile(user.id)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setMember(null)
    setIsMember(false)
    setUser(null)
  }

  const value = {
    user,
    profile,
    member,
    isMember,
    loading,
    refreshProfile: async () => {
      if (user) await fetchProfile(user.id)
    },
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return context
}
