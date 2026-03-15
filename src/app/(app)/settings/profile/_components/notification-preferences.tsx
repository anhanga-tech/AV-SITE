'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { UseFormReturn } from 'react-hook-form'
import { Bell, Mail, MessageSquare, Send } from 'lucide-react'
import { ProfileFormValues } from '../_types'

interface NotificationPreferencesProps {
  form: UseFormReturn<ProfileFormValues>
}

export function NotificationPreferences({ form }: NotificationPreferencesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Preferências de Notificação</h3>
      </div>
      
      <div className="grid gap-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-base">Lembretes por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba resumos diários e alertas de tarefas atrasadas.
              </p>
            </div>
          </div>
          <Switch 
            checked={form.watch('email_reminders')}
            onCheckedChange={(checked) => form.setValue('email_reminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-base">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Alertas em tempo real no seu navegador ou celular.
              </p>
            </div>
          </div>
          <Switch 
            checked={form.watch('push_notifications')}
            onCheckedChange={(checked) => form.setValue('push_notifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 opacity-60">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label className="text-base">WhatsApp</Label>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Em breve</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Notificações rápida direto no seu WhatsApp.
              </p>
            </div>
          </div>
          <Switch disabled />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4 opacity-60">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label className="text-base">Telegram</Label>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Em breve</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Integração com nosso bot do Telegram.
              </p>
            </div>
          </div>
          <Switch disabled />
        </div>
      </div>
    </div>
  )
}
