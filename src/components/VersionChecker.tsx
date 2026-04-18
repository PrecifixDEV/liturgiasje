"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { APP_VERSION } from "@/constants/version"
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"

export function VersionChecker() {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkVersion() {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "min_version")
          .single()

        if (error) throw error

        if (data && data.value !== APP_VERSION) {
          setNeedsUpdate(true)
        }
      } catch (error: any) {
        console.error("Erro ao verificar versão:", error.message || error)
      } finally {
        setIsChecking(false)
      }
    }

    checkVersion()
    
    // Verificar a cada 30 minutos se o app for deixado aberto
    const interval = setInterval(checkVersion, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleUpdate = async () => {
    // Tenta desregistrar o service worker primeiro para garantir que o novo sw.js seja baixado
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
    }
    
    // Limpar caches se possível
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    // Recarregamento forçado do servidor
    window.location.reload();
  }

  if (!needsUpdate) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-[#322113] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        
        {/* Favicon/Logo Centralizado */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
          <img 
            src="/icons/android-chrome-192x192.png" 
            alt="Logo Liturgia SJE" 
            className="w-24 h-24 relative shadow-2xl rounded-3xl border border-white/10"
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">
            Nova Versão<br />Disponível
          </h1>
          <p className="text-stone-400 text-sm font-medium leading-relaxed px-4">
            Uma atualização importante foi liberada para garantir o funcionamento correto das suas escalas.
          </p>
        </div>

        <div className="w-full pt-4">
          <Button 
            onClick={handleUpdate}
            variant="default" 
            className="w-full h-14 bg-white text-[#322113] hover:bg-stone-100 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-black/20 group transition-all"
          >
            <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            Atualizar Agora
          </Button>
          <span className="mt-4 block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
            Patch v{APP_VERSION}
          </span>
        </div>

      </div>
    </div>
  )
}
