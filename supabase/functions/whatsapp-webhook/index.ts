
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const WHATSAPP_SALT = Deno.env.get('WHATSAPP_SALT') || 'default-secret-salt';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper to hash phone numbers securely
async function hashPhone(phone: string): Promise<string> {
  const message = `${phone}:${WHATSAPP_SALT}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(hashBuffer);
}

serve(async (req) => {
  // 1. Health & Verification Challenge (Meta specific)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('WHATSAPP_VERIFY_TOKEN')) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // 2. Webhook Processing (POST)
  try {
    const payload = await req.json();

    // Basic Meta Payload Extraction (Adjust based on your provider: Meta Cloud API vs Twilio)
    // Structure: entry[0].changes[0].value.messages[0]
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    // If no message (e.g. status update), just ack
    if (!message) {
      return new Response('OK', { status: 200 });
    }

    const fromPhone = message.from; // Raw phone (E.164)
    const messageBody = message.text?.body?.trim() || '';
    const phoneHash = await hashPhone(fromPhone);

    // 3. Identify User by Hash
    const { data: link } = await supabase
      .from('whatsapp_links')
      .select('user_id, org_id, verified')
      .eq('phone_hash', phoneHash)
      .maybeSingle();

    // 4. Log the Attempt (Privacy Safe)
    await supabase.from('whatsapp_messages_log').insert({
      direction: 'in',
      message_type: 'text',
      // intent: will be filled later if classified
      status: link ? 'processed' : 'unlinked',
      user_id: link?.user_id || null,
      org_id: link?.org_id || null
    });

    // =========================================================================
    // LINKING FLOW (If user not found)
    // =========================================================================
    if (!link) {
      // Check if message is a 6-digit code
      if (/^\d{6}$/.test(messageBody)) {
        console.log('Attempting to link with code:', messageBody);

        const { data: codeData, error: codeError } = await supabase
          .from('whatsapp_verification_codes')
          .select('*')
          .eq('code', messageBody)
          .gt('expires_at', new Date().toISOString()) // Must not be expired
          .single();

        if (codeData) {
          // Determine org_id to use.
          // The verification code has org_id.

          // Create the Link
          const { error: insertError } = await supabase
            .from('whatsapp_links')
            .insert({
              user_id: codeData.user_id,
              org_id: codeData.org_id,
              phone_hash: phoneHash,
              phone_last4: fromPhone.slice(-4), // Privacy safe last 4 digits
              verified: true
            });

          if (insertError) {
            console.error('Link Insert Error', insertError);
            // Reply error (mock)
            return new Response(JSON.stringify({ reply: 'Erro ao vincular. Tente novamente.' }), { status: 200 });
          }

          // Delete used code
          await supabase.from('whatsapp_verification_codes').delete().eq('code', messageBody);

          // Send Welcome Message (Mock - in real life call Meta API to send msg)
          // "Parabéns! Seu WhatsApp foi vinculado com sucesso ao VIDA360."
          console.log(`User ${codeData.user_id} linked successfully!`);
          return new Response(JSON.stringify({ reply: 'Vinculado com sucesso!' }), { status: 200 });

        } else {
          console.log('Invalid or expired code');
          // Reply: "Código inválido ou expirado."
          return new Response(JSON.stringify({ reply: 'Código inválido ou expirado.' }), { status: 200 });
        }
      } else {
        // Reply instruction
        // "Olá! Para usar o VIDA360, vá em Configurações no app e gere um código de conexão."
        console.log('Unlinked user sent non-code message');
        return new Response(JSON.stringify({ reply: 'Envie o código de 6 dígitos gerado no app.' }), { status: 200 });
      }
    }

    // =========================================================================
    // AUTHENTICATED FLOW (Intents)
    // =========================================================================
    if (link && link.verified) {
      console.log(`Authenticated message from User ${link.user_id}: ${messageBody}`);

      // TODO: Sprint 6 (Part 3) - Add Intent Classification here
      // e.g. "Agendar reunião amanhã" -> Calendar Service

      // For now, Echo
      return new Response(JSON.stringify({ reply: `Recebido: ${messageBody}` }), { status: 200 });
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
