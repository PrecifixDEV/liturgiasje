"use client"

import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"
import { useState } from "react"

export default function FolhetoPage() {
  const { profile, loading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      
      <main className="flex-1 relative w-full h-full overflow-hidden bg-stone-100">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50/80 backdrop-blur-sm z-10">
            <Loader2 className="h-10 w-10 animate-spin text-stone-400 mb-4" />
            <p className="text-stone-500 font-bold text-sm uppercase tracking-widest animate-pulse">
              Carregando Folheto...
            </p>
          </div>
        )}
        
        <iframe 
          src={`https://docs.google.com/gview?url=https://www.arqrio.com.br/app/painel/amissa/amissa.pdf&embedded=true`}
          className="w-full h-full border-none shadow-inner"
          onLoad={() => setIsLoading(false)}
          title="Folheto da Missa"
        />
      </main>
    </div>
  )
}
