"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function PWAHandler() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      
      // 1. Recarregar a página quando um novo Service Worker assume o controle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          // 2. Verificar se há uma atualização esperando
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão instalada. Como o sw.js tem skipWaiting(), 
                // ele ativará e disparará o 'controllerchange'.
                toast.info("Nova versão disponível! Atualizando...", {
                  description: "O aplicativo será recarregado em instantes.",
                  duration: 5000,
                });
              }
            });
          });

          console.log('PWA Service Worker registrado com sucesso:', registration.scope)
          
          // Verificar atualizações manualmente a cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

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
