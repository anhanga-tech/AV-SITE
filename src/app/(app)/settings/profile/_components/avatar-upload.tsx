'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'
import { uploadAvatar } from '@/features/profile/actions'

interface AvatarUploadProps {
  currentAvatarUrl: string | null
  userName: string
  onUploadSuccess: (url: string) => void
}

export function AvatarUpload({ currentAvatarUrl, userName, onUploadSuccess }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U'

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Simple client side validation
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande. O limite é 2MB.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await uploadAvatar(formData)
      if (result.success && result.avatarUrl) {
        onUploadSuccess(result.avatarUrl)
      } else if (result.error) {
        alert('Erro no upload: ' + result.error)
      }
    } catch (error) {
      alert('Erro inesperado: ' + (error instanceof Error ? error.message : 'Desconhecido'))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative group">
        <Avatar className="h-24 w-24 border-2 border-background shadow-sm">
          <AvatarImage src={currentAvatarUrl || ''} />
          <AvatarFallback className="text-xl bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="mr-2 h-4 w-4" />
            Alterar foto
          </Button>
          {currentAvatarUrl && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              disabled={isUploading}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                // Future: add delete avatar action
                alert('Funcionalidade de remover foto em breve.')
              }}
            >
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP. Máximo de 2MB.
        </p>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
