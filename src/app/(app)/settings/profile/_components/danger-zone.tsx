'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogClose,
  DialogTrigger 
} from '@/components/ui/dialog'
import { LogOut, Key, AlertTriangle } from 'lucide-react'
import { signOut } from '@/features/profile/actions'
import { supabase } from '@/lib/supabase/client'

export function DangerZone() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  async function handleResetPassword() {
    setIsResettingPassword(true)
    setFeedbackMessage('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/settings/profile`,
        })
        if (error) {
          setFeedbackMessage('Erro ao enviar email de recuperação: ' + error.message)
        } else {
          setFeedbackMessage('Email de recuperação enviado com sucesso!')
        }
      } else {
        setFeedbackMessage('Não foi possível identificar um e-mail para esta conta.')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setFeedbackMessage('Erro ao processar solicitação.')
    } finally {
      setIsResettingPassword(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setIsLoggingOut(false)
      setFeedbackMessage('Erro ao sair.')
    }
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          Ações sensíveis da sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-destructive/10 p-4 bg-background">
          <div className="space-y-0.5">
            <h4 className="font-medium text-destructive">Alterar Senha</h4>
            <p className="text-sm text-muted-foreground">
              Enviaremos um link de alteração para seu email.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetPassword}
            disabled={isResettingPassword}
          >
            <Key className="mr-2 h-4 w-4" />
            Alterar
          </Button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <div className="flex items-center justify-between rounded-lg border border-destructive/10 p-4 bg-background cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="space-y-0.5">
                <h4 className="font-medium text-destructive">Encerrar Sessão</h4>
                <p className="text-sm text-muted-foreground">
                  Desconectar de todos os dispositivos.
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tem certeza que deseja sair?</DialogTitle>
              <DialogDescription>
                Você precisará fazer login novamente para acessar suas informações.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost" disabled={isLoggingOut}>Cancelar</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Saindo...' : 'Confirmar Logout'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {feedbackMessage && (
          <p
            className={`text-sm ${feedbackMessage.includes('sucesso') ? 'text-emerald-600' : 'text-destructive'}`}
            role="status"
            aria-live="polite"
          >
            {feedbackMessage}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
