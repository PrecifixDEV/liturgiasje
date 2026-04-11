"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { userService, UserProfile } from "@/services/userService"
import { memberService } from "@/services/memberService"

export function useAuth() {
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
    // 1. Verificar sessão atual ao montar
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setLoading(false)
      }
    })

    // 2. Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
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
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
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
