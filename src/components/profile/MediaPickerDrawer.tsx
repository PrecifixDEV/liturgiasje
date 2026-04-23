"use client"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Camera, Image as ImageIcon, Sparkles, Trash2 } from "lucide-react"

interface MediaPickerDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelectCamera: () => void
  onSelectGallery: () => void
  onSelectGoogle: () => void
  onRemovePhoto?: () => void
  hasPhoto?: boolean
}

export function MediaPickerDrawer({
  isOpen,
  onClose,
  onSelectCamera,
  onSelectGallery,
  onSelectGoogle,
  onRemovePhoto,
  hasPhoto = false
}: MediaPickerDrawerProps) {
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="bg-stone-50 border-none pb-8">
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-stone-200" />
        
        <DrawerHeader className="text-center pb-6">
          <DrawerTitle className="text-stone-800 font-black text-lg uppercase tracking-tight">
            Escolher Foto
          </DrawerTitle>
        </DrawerHeader>

        <div className="grid grid-cols-3 gap-4 px-6">
          <button 
            onClick={onSelectCamera}
            className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-stone-100 shadow-sm transition-all active:scale-90 hover:bg-stone-100"
          >
            <div className="h-12 w-12 bg-blue-50 flex items-center justify-center rounded-2xl">
              <Camera className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Câmera</span>
          </button>

          <button 
            onClick={onSelectGallery}
            className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-stone-100 shadow-sm transition-all active:scale-90 hover:bg-stone-100"
          >
            <div className="h-12 w-12 bg-green-50 flex items-center justify-center rounded-2xl">
              <ImageIcon className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Galeria</span>
          </button>

          <button 
            onClick={onSelectGoogle}
            className="flex flex-col items-center gap-3 p-4 bg-white rounded-3xl border border-stone-100 shadow-sm transition-all active:scale-90 hover:bg-stone-100"
          >
            <div className="h-12 w-12 bg-amber-50 flex items-center justify-center rounded-2xl">
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Google</span>
          </button>
        </div>

        {hasPhoto && onRemovePhoto && (
          <div className="px-6 mt-6">
            <button 
              onClick={onRemovePhoto}
              className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              Remover Foto Atual
            </button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
