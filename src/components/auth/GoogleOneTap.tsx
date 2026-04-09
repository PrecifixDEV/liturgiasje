"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"

export function GoogleOneTap() {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading || user) return

    const initializeOneTap = async () => {
      if (!window.google) return

      // Gerar nonce para segurança (necessário para o Supabase validar o ID Token)
      const rawNonce = Math.random().toString(36).substring(2, 15)
      const encoder = new TextEncoder()
      const data = encoder.encode(rawNonce)
      const hashBuffer = await crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
        nonce: hashedNonce, // Passa o hash para o Google
        callback: async (response: any) => {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: response.credential,
              nonce: rawNonce, // Passa o valor original para o Supabase validar
            })
            if (error) throw error
            console.log("Login One Tap realizado com sucesso")
          } catch (error) {
            console.error("Erro no login One Tap:", error)
          }
        },
        auto_select: false,
        use_fedcm_for_prompt: true,
        itp_support: true,
        cancel_on_tap_outside: true,
      })

      window.google.accounts.id.prompt()
    }

    const interval = setInterval(() => {
      if (window.google) {
        initializeOneTap()
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [user, loading])

  return null
}

// Declarar tipos globais para o Google Identity Services
declare global {
  interface Window {
    google: any
  }
}
