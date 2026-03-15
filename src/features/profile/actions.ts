'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const name = formData.get('name') as string
    const emailReminders = formData.get('email_reminders') === 'true'
    const pushNotifications = formData.get('push_notifications') === 'true'
    const whatsapp = formData.get('whatsapp') === 'true'
    const telegram = formData.get('telegram') === 'true'

    const { error } = await supabase
        .from('profiles')
        .update({
            name,
            notification_preferences: {
                email_reminders: emailReminders,
                push_notifications: pushNotifications,
                whatsapp,
                telegram,
            },
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/settings/profile')
    return { success: true }
}

export async function uploadAvatar(formData: FormData) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const file = formData.get('file') as File
    if (!file) {
        return { error: 'No file provided' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

    if (uploadError) {
        return { error: uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

    if (updateError) {
        return { error: updateError.message }
    }

    revalidatePath('/settings/profile')
    return { success: true, avatarUrl: publicUrl }
}

export async function signOut() {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/login')
}
