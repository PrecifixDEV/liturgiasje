"use client"

import { useAuth } from "@/hooks/useAuth"
import { Header } from "./Header"
import { usePathname } from "next/navigation"

export function PersistentHeader() {
  const { profile, signInWithGoogle, signOut, loading } = useAuth()
  const pathname = usePathname()

  // Lista de páginas onde o Header NÃO deve aparecer
  const hideHeaderOn = ["/bemvindo", "/auth/callback"]
  
  if (hideHeaderOn.includes(pathname)) {
    return null
  }

  const headerUser = profile ? {
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    role: profile.role
  } : null

  return (
    <Header 
      user={headerUser} 
      onSignIn={signInWithGoogle}
      onSignOut={signOut}
    />
  )
}
