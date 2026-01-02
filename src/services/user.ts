import { supabase, supabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface UpdateProfileData {
    full_name: string;
    avatar_url?: string | null;
    age?: number | null;
    profession?: string | null;
    routine?: string | null;
    description?: string | null; // routine alias if needed, sticking to migration 'routine'
    phone?: string | null;
    language?: string;
}

export async function updateProfile(userId: string, data: UpdateProfileData): Promise<{ success: boolean; error?: string }> {
    if (!supabaseConfigured) return { success: false, error: 'Supabase não configurado' };

    const updateData: any = { full_name: data.full_name.trim() };
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.profession !== undefined) updateData.profession = data.profession;
    if (data.routine !== undefined) updateData.routine = data.routine;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.language !== undefined) updateData.language = data.language;

    const { error } = await supabase.from('profiles').update(updateData as any).eq('user_id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error?: string }> {
    if (!supabaseConfigured) return { url: null, error: 'Supabase não configurado' };

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Delete old avatars
    const { data: existingFiles } = await supabase.storage.from('avatars').list(userId);
    if (existingFiles?.length) {
        await supabase.storage.from('avatars').remove(existingFiles.map(f => `${userId}/${f.name}`));
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (uploadError) return { url: null, error: uploadError.message };

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    return { url: urlData.publicUrl };
}

export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!supabaseConfigured) return { success: false, error: 'Supabase não configurado' };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
}
