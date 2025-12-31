
export type IntentType = 'LINK_CODE' | 'LIST_AGENDA' | 'CREATE_EVENT' | 'HELP' | 'UNKNOWN';

type IntentPayload =
    | { code: string }
    | { period: 'today' | 'tomorrow' | 'upcoming' }
    | { raw: string };

export interface IntentResult {
    type: IntentType;
    payload?: IntentPayload;
}

export function classifyIntent(text: string): IntentResult {
    const cleanText = text.trim().toLowerCase();

    // 1. Link Code (6 digits)
    if (/^\d{6}$/.test(cleanText)) {
        return { type: 'LINK_CODE', payload: { code: cleanText } };
    }

    // 2. Help
    if (['oi', 'olá', 'ola', 'ajuda', 'menu', 'comandos', 'help', 'inicio'].includes(cleanText)) {
        return { type: 'HELP' };
    }

    // 3. List Agenda (Keywords: agenda, hoje, amanha)
    if (cleanText.includes('agenda') || cleanText.includes('compromissos')) {
        return { type: 'LIST_AGENDA', payload: { period: 'upcoming' } };
    }
    if (cleanText.includes('hoje')) {
        return { type: 'LIST_AGENDA', payload: { period: 'today' } };
    }
    if (cleanText.includes('amanhã') || cleanText.includes('amanha')) {
        return { type: 'LIST_AGENDA', payload: { period: 'tomorrow' } };
    }

    // 4. Create Event (Simple Regex: "agendar [algo] [quando]")
    // Ex: "agendar dentista amanhã 15h"
    // Regex looking for 'agendar' or 'marcar'
    if (cleanText.startsWith('agendar') || cleanText.startsWith('marcar') || cleanText.startsWith('novo evento')) {
        return { type: 'CREATE_EVENT', payload: { raw: text } }; // We'll parse details later
    }

    return { type: 'UNKNOWN' };
}
