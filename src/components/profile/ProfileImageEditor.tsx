"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { userService } from "@/services/userService"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ImageCropperModal } from "./ImageCropperModal"
import { Camera, UserCircle, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { MediaPickerDrawer } from "./MediaPickerDrawer"

export function ProfileImageEditor() {
  const { user, profile, refreshProfile } = useAuth()
  const [isCropperOpen, setIsCropperOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setSelectedImage(reader.result as string)
        setIsCropperOpen(true)
        setIsPickerOpen(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveCroppedImage = async (blob: Blob) => {
    if (!user) return
    setIsUpdating(true)
    try {
      await userService.uploadAvatar(user.id, blob)
      toast.success("Foto de perfil atualizada!")
      await refreshProfile()
    } catch (error) {
      console.error(error)
      toast.error("Erro ao fazer upload da foto.")
    } finally {
      setIsUpdating(false)
      setSelectedImage(null)
    }
  }

  const handlePullFromGoogle = async () => {
    const googleAvatarUrl = user?.user_metadata?.avatar_url
    if (!googleAvatarUrl || !user) {
      toast.error("Foto do Google não encontrada.")
      return
    }

    setIsUpdating(true)
    setIsPickerOpen(false)
    try {
      await userService.updateProfile(user.id, { avatar_url: googleAvatarUrl })
      toast.success("Foto importada do Google!")
      await refreshProfile()
    } catch (error) {
      toast.error("Erro ao importar foto.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemovePhoto = async () => {
    if (!user) return
    setIsUpdating(true)
    setIsPickerOpen(false)
    try {
      await userService.updateProfile(user.id, { avatar_url: null })
      toast.success("Foto removida.")
      await refreshProfile()
    } catch (error) {
      toast.error("Erro ao remover foto.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative group">
        <div 
          onClick={() => setIsPickerOpen(true)}
          className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
        >
          <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-2 ring-stone-100">
            <AvatarImage src={profile?.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-stone-50">
              <UserCircle className="h-16 w-16 text-stone-300" />
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute -bottom-1 -right-1 h-10 w-10 bg-stone-800 rounded-full flex items-center justify-center border-4 border-white shadow-lg text-white">
            <Camera className="h-5 w-5" />
          </div>

          {isUpdating && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-stone-800" />
            </div>
          )}
        </div>
        
        {/* Inputs Ocultos */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="user"
          onChange={handleFileChange} 
        />
      </div>

      <MediaPickerDrawer 
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectCamera={() => cameraInputRef.current?.click()}
        onSelectGallery={() => fileInputRef.current?.click()}
        onSelectGoogle={handlePullFromGoogle}
        onRemovePhoto={handleRemovePhoto}
        hasPhoto={!!profile?.avatar_url}
      />

      {selectedImage && (
        <ImageCropperModal
          image={selectedImage}
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false)
            setSelectedImage(null)
          }}
          onSave={handleSaveCroppedImage}
        />
      )}
    </div>
  )
}

