"use client"

import { useAuth } from "@/hooks/useAuth"
import { Loader2, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function FolhetoPage() {
  const { profile, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Fallback para evitar carregamento infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 10000) // 10 segundos de limite

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      {/* Cabeçalho Premium Centralizado */}
      <header className="flex items-center px-4 h-20 bg-[#FDFCF0] border-b border-stone-200 shrink-0 relative">
        {/* Botão Voltar Absoluto à Esquerda */}
        <div className="absolute left-2 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/")}
            className="rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>

        {/* Logo e Título Centralizados */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <div className="relative h-12 w-12 shrink-0">
            <Image 
              src="/favicon.png" 
              alt="Logo SJE" 
              fill
              className="object-contain rounded-xl shadow-sm"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-stone-800 leading-none tracking-tight">
              Liturgia SJE
            </h1>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
              Painel do Leitor
            </span>
          </div>
        </div>
        
        {/* Espaçador invisível à direita para manter a centralização perfeita */}
        <div className="w-10" />
      </header>

      <main className="flex-1 relative w-full h-full overflow-hidden bg-stone-100">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-stone-800" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-stone-800 rounded-full animate-ping" />
              </div>
            </div>
            <p className="mt-6 text-stone-900 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">
              Carregando Folheto...
            </p>
          </div>
        )}
        
        <iframe 
          src={`https://docs.google.com/gview?url=https://pvgjzunalzpwaditseys.supabase.co/storage/v1/object/public/leaflets/folheto_atual.pdf&embedded=true`}
          className="w-full h-full border-none"
          onLoad={() => setIsLoading(false)}
          title="Folheto da Missa"
        />
      </main>
    </div>
  )
}
