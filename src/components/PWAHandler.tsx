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

      const subscribeToNotifications = async (registration: ServiceWorkerRegistration) => {
        try {
          // 1. Verificar se notificações são suportadas
          if (!('Notification' in window)) return;

          // 2. Se a permissão for negada, não faz nada
          if (Notification.permission === 'denied') return;

          // 3. Se ainda não há permissão (default), podemos mostrar um convite
          if (Notification.permission === 'default') {
            toast.info("Deseja receber notificações?", {
              description: "Fique por dentro de novos recados e escalas.",
              action: {
                label: "Ativar",
                onClick: async () => {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    await performSubscription(registration);
                  }
                }
              },
              duration: 10000,
            });
            return;
          }

          // 4. Se já tem permissão, garante que está inscrito
          if (Notification.permission === 'granted') {
            await performSubscription(registration);
          }
        } catch (error) {
          console.error('Erro ao configurar notificações push:', error);
        }
      };

      const performSubscription = async (registration: ServiceWorkerRegistration) => {
        const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) return;

        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
        }

        // Enviar subscrição para o servidor
        await fetch('/api/push/subscribe', {
          method: 'POST',
          body: JSON.stringify({ subscription }),
          headers: { 'Content-Type': 'application/json' }
        });
      };

      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js')
          
          // Função para mostrar o aviso de atualização
          const showUpdateToast = (waitingWorker: ServiceWorker) => {
            toast.info("Nova versão disponível!", {
              description: "Deseja atualizar o aplicativo agora?",
              action: {
                label: "Atualizar",
                onClick: () => {
                  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              },
              duration: Infinity, // Fica visível até o usuário agir
            });
          };

          // 1. Verificar se já existe um worker esperando (ex: carregou a página e tinha um pendente)
          if (registration.waiting) {
            showUpdateToast(registration.waiting);
          }

          // 2. Escutar por novos workers que cheguem ao estado 'installed' (waiting)
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdateToast(newWorker);
              }
            });
          });

          console.log('PWA Service Worker registrado com sucesso:', registration.scope)
          
          // Forçar uma checagem de atualização imediata e depois a cada 10 minutos
          registration.update();
          
          // Tentar subscrever para notificações após registro bem sucedido
          await subscribeToNotifications(registration);

          // Verificar atualizações manualmente frequentes para maior agilidade
          setInterval(() => {
            registration.update();
          }, 10 * 60 * 1000);

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

// Auxiliar para converter a chave VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
