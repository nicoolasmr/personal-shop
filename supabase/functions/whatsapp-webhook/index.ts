
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.177.0/encoding/hex.ts";

const WHATSAPP_SALT = Deno.env.get('WHATSAPP_SALT') || 'default-salt-CHANGE-ME-IN-PROD';
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

    // Very Basic Meta Payload Extraction (Example)
    // Structure: entry[0].changes[0].value.messages[0]
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return new Response('No message found', { status: 200 }); // Ack to stop retries
    }

    const fromPhone = message.from; // Raw phone (E.164)
    const messageBody = message.text?.body || '';
    const phoneHash = await hashPhone(fromPhone);

    // 3. Identify User by Hash
    const { data: link, error: linkError } = await supabase
      .from('whatsapp_links')
      .select('user_id, org_id, verified')
      .eq('phone_hash', phoneHash)
      .single();

    // 4. Log the Attempt (Privacy Safe)
    await supabase.from('whatsapp_messages_log').insert({
      direction: 'in',
      message_type: 'text',
      status: link ? 'processed' : 'unknown_user',
      // If user is known, log IDs. If not, log null to avoid orphaned logs pollution
      user_id: link?.user_id || null,
      org_id: link?.org_id || null
    });

    if (!link || !link.verified) {
      // TODO: Trigger Verification Flow
      // For now, just log and return
      console.log(`Unknown or unverified user hash: ${phoneHash.substring(0, 10)}...`);
      return new Response('OK', { status: 200 });
    }

    // 5. Process Intent (Example: Echo)
    // In real implementation, this calls an Intent Classifier Service
    console.log(`Processing message for User ${link.user_id}`);

    // For now, assume success
    return new Response('Processed', { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
