'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { updateProfile } from '@/features/profile/actions'
import { AvatarUpload } from './avatar-upload'
import { NotificationPreferences } from './notification-preferences'
import { DangerZone } from './danger-zone'
import { ProfileFormValues } from '../_types'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email_reminders: z.boolean(),
  push_notifications: z.boolean(),
  whatsapp: z.boolean(),
  telegram: z.boolean(),
})

interface ProfileFormProps {
  profile: {
    id: string
    name: string | null
    avatar_url: string | null
    notification_preferences: {
      email_reminders: boolean
      push_notifications: boolean
      whatsapp: boolean
      telegram: boolean
    }
  }
  userEmail: string
}

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name || '',
      email_reminders: profile.notification_preferences?.email_reminders ?? true,
      push_notifications: profile.notification_preferences?.push_notifications ?? false,
      whatsapp: profile.notification_preferences?.whatsapp ?? false,
      telegram: profile.notification_preferences?.telegram ?? false,
    },
  })

  async function onSubmit(data: ProfileFormValues) {
    setIsSubmitting(true)
    setFeedbackMessage('')
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('email_reminders', data.email_reminders.toString())
    formData.append('push_notifications', data.push_notifications.toString())
    formData.append('whatsapp', data.whatsapp.toString())
    formData.append('telegram', data.telegram.toString())

    try {
      const result = await updateProfile(formData)
      if (result?.error) {
        setFeedbackMessage('Erro ao atualizar perfil: ' + result.error)
      } else {
        setFeedbackMessage('Perfil atualizado com sucesso!')
      }
    } catch (error) {
      setFeedbackMessage('Erro inesperado: ' + (error instanceof Error ? error.message : 'Desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
          <CardDescription>
            Sua foto e detalhes públicos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AvatarUpload 
            currentAvatarUrl={avatarUrl} 
            userName={form.watch('name')} 
            onUploadSuccess={(url: string) => setAvatarUrl(url)}
          />
          
          <Separator />

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (não editável)</Label>
              <Input id="email" value={userEmail} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input 
                id="name" 
                {...form.register('name')} 
                placeholder="Seu nome"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <Separator className="my-6" />

            <NotificationPreferences form={form} />

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>

            {feedbackMessage && (
              <p
                className={`text-sm ${feedbackMessage.includes('sucesso') ? 'text-emerald-600' : 'text-destructive'}`}
                role="status"
                aria-live="polite"
              >
                {feedbackMessage}
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <DangerZone />
    </div>
  )
}
