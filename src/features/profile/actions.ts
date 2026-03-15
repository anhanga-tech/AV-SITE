'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024

function normalizeName(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

function isImageFile(file: File) {
  return typeof file.type === 'string' && file.type.startsWith('image/')
}

function getBoolean(formData: FormData, field: string) {
  return formData.get(field) === 'true'
}

export async function updateProfile(formData: FormData) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Not authenticated')
    }

    const name = normalizeName(formData.get('name'))
    const emailReminders = getBoolean(formData, 'email_reminders')
    const pushNotifications = getBoolean(formData, 'push_notifications')
    const whatsapp = getBoolean(formData, 'whatsapp')
    const telegram = getBoolean(formData, 'telegram')

    if (name.length < 2) {
        return { error: 'Nome deve ter pelo menos 2 caracteres.' }
    }

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

    const file = formData.get('file')
    if (!(file instanceof File)) {
        return { error: 'No file provided' }
    }

    if (!isImageFile(file)) {
        return { error: 'O arquivo deve ser uma imagem.' }
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
        return { error: 'O arquivo deve ter no máximo 2MB.' }
    }

    const filePath = `${user.id}/avatar`

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true,
            contentType: file.type,
        })

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
