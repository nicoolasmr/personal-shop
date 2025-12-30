
# WhatsApp Development Workflow

## 1. Setup Local
Since we are using Supabase Edge Functions, you can test locally using Supabase CLI.

```bash
supabase functions serve whatsapp-webhook --no-verify-jwt
```

## 2. Simulate Webhook (Postman / Curl)

### A. Verification Challenge (GET)
Use this to confirm the webhook is reachable and token is correct.
```bash
curl -i -X GET 'http://localhost:54321/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=MY_TEST_TOKEN&hub.challenge=112233'
```

### B. Incoming Message (POST)
Simulate a message from a user.

**1. Unlinked User sending a Code:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WHATSAPP_BUSINESS_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": { "display_phone_number": "123456789", "phone_number_id": "PHONE_ID" },
        "contacts": [{ "profile": { "name": "Nicolas" }, "wa_id": "5511999999999" }],
        "messages": [{
          "from": "5511999999999",
          "id": "wamid.HBgM...",
          "timestamp": "1700000000",
          "text": { "body": "123456" },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**2. Linked User sending a Command:**
Same payload, but change body to: `Agendar dentista amanhã 14h`

## 3. Intents Plan (Sprint 6 Part 3)

| Intent | Regex / Logic | Action |
| :--- | :--- | :--- |
| **Link** | `^\d{6}$` | Verifica código e cria link user <-> phone. |
| **Create Event** | `(agendar\|marcar\|novo).+` | Extrai data/hora com NLP básico e cria `calendar_events`. |
| **List Agenda** | `(agenda\|hoje\|amanhã)` | Lista eventos do dia/amanhã. |
| **Help** | `(ajuda\|menu)` | Lista comandos disponíveis. |
