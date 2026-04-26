"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User as UserIcon, X } from "lucide-react"

interface UserAvatarLightboxProps {
  name: string
  avatarUrl?: string
  children: React.ReactNode
}

export function UserAvatarLightbox({ name, avatarUrl, children }: UserAvatarLightboxProps) {
  if (!avatarUrl) return <>{children}</>

  return (
    <Dialog>
      <DialogTrigger className="focus:outline-none transition-transform active:scale-95 text-left border-none bg-transparent p-0">
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-md p-1 border-none bg-transparent shadow-none flex items-center justify-center focus:outline-none">
        <div className="relative group w-full aspect-square max-w-[400px]">
          <div className="absolute -top-12 left-0 right-0 text-center">
            <h3 className="text-stone-900 font-black text-xl">{name}</h3>
          </div>
          
          <div className="w-full h-full rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl bg-stone-100">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={name} 
                className="w-full h-full object-cover animate-in zoom-in-95 duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-stone-100">
                <UserIcon className="h-20 w-20 text-stone-300" />
              </div>
            )}
          </div>

          <DialogTrigger className="absolute -bottom-12 left-1/2 -translate-x-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border-none">
            <X className="h-6 w-6" />
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  )
}
