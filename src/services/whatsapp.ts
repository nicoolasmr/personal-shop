
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

export interface WhatsAppLink {
    id: string;
    phone_last4: string | null;
    verified: boolean;
    created_at: string;
}

export const whatsappService = {
    /**
     * Gera um código de verificação temporário para o usuário vincular o WhatsApp.
     */
    async generateVerificationCode(orgId: string): Promise<{ code: string; expires_at: string }> {
        // Gerar código aleatório de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Define expiração (ex: 15 minutos)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        const { error } = await supabase
            .from('whatsapp_verification_codes')
            .upsert({
                code,
                org_id: orgId,
                expires_at: expiresAt
            });

        if (error) throw new Error('Erro ao gerar código de verificação');

        return { code, expires_at: expiresAt };
    },

    /**
     * Verifica se o usuário já tem um WhatsApp vinculado.
     */
    async getLinkStatus(): Promise<WhatsAppLink | null> {
        const { data, error } = await supabase
            .from('whatsapp_links')
            .select('id, phone_last4, verified, created_at')
            .maybeSingle();

        if (error) throw new Error('Erro ao buscar status do WhatsApp');
        return data as WhatsAppLink | null;
    },

    /**
     * Desvincula (remove) o WhatsApp do usuário.
     */
    async unlinkWhatsApp(linkId: string) {
        const { error } = await supabase
            .from('whatsapp_links')
            .delete()
            .eq('id', linkId);

        if (error) throw new Error('Erro ao desvincular WhatsApp');
    }
};
