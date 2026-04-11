"use client"

import { useEffect } from "react"

export function PWAHandler() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('PWA Service Worker registrado com sucesso:', registration.scope)
        } catch (error) {
          console.error('Erro ao registrar PWA Service Worker:', error)
        }
      }

      // Tenta registrar apenas se o ambiente não for de desenvolvimento ou se for localhost seguro
      if (process.env.NODE_ENV === 'production' || window.location.hostname === 'localhost') {
        registerServiceWorker()
      }
    }
  }, [])

  return null // Este componente não renderiza nada visualmente
}
