"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase"
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js"
import { userService, UserProfile } from "@/services/userService"
import { memberService } from "@/services/memberService"

export function useAuth() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [member, setMember] = useState<any | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    setLoading(true)
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
    // 1. Verificar usuário atual ao montar (Usando getUser para segurança)
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: User | null } }) => {
      setUser(user)
      if (user) {
        fetchProfile(user.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          fetchProfile(currentUser.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

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
    setUser(null)
  }

  return {
    user,
    profile,
    member,
    isMember,
    loading,
    refreshProfile: () => user && fetchProfile(user.id),
    signInWithGoogle,
    signOut,
  }
}
