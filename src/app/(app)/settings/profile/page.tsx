import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'
import { ProfileForm } from './_components/profile-form'

export default async function ProfilePage() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const profile = await getUserProfile(supabase, user.id)

    if (!profile) {
        // This shouldn't happen due to the trigger, but as a fallback:
        redirect('/dashboard')
    }

    return (
        <div className="mx-auto max-w-2xl py-8">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Configurações de Perfil</h1>
                <p className="text-muted-foreground">
                    Gerencie suas informações pessoais e preferências de notificação.
                </p>
            </div>
            
            <ProfileForm profile={profile} userEmail={user.email ?? 'E-mail não disponível'} />
        </div>
    )
}
