
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types needed
interface CalendarEvent {
    title: string;
    start_at: string;
    end_at: string;
    all_day: boolean;
}

export async function handleListAgenda(
    supabase: any,
    userId: string,
    orgId: string,
    period: 'today' | 'tomorrow' | 'upcoming'
): Promise<string> {
    const now = new Date();
    // Adjust to BRT (UTC-3) rough/fixed for MVP
    // Better way: store user timezone. Assuming -3 for now.
    const offset = -3;

    let start: Date, end: Date;
    let title = "";

    if (period === 'today') {
        start = new Date(now);
        start.setUTCHours(0 - offset, 0, 0, 0);
        end = new Date(start);
        end.setUTCDate(start.getUTCDate() + 1);
        title = "📅 *Sua Agenda de Hoje:*";
    } else if (period === 'tomorrow') {
        start = new Date(now);
        start.setUTCDate(start.getUTCDate() + 1);
        start.setUTCHours(0 - offset, 0, 0, 0);
        end = new Date(start);
        end.setUTCDate(start.getUTCDate() + 1);
        title = "📅 *Sua Agenda para Amanhã:*";
    } else {
        // Upcoming 3 days
        start = new Date(now);
        end = new Date(now);
        end.setUTCDate(end.getUTCDate() + 3);
        title = "📅 *Próximos Compromissos:*";
    }

    const { data: events, error } = await supabase
        .from('calendar_events')
        .select('title, start_at, end_at, all_day')
        .eq('org_id', orgId) // Secure query by linked org
        .gte('end_at', start.toISOString())
        .lt('start_at', end.toISOString())
        .order('start_at');

    if (error) {
        console.error('Calendar Error', error);
        return "Desculpe, tive um erro ao acessar sua agenda.";
    }

    if (!events || events.length === 0) {
        return `${title}\n\nNenhum evento encontrado. Aproveite o dia! 😎`;
    }

    // Format output
    let response = `${title}\n`;

    events.forEach((ev: CalendarEvent) => {
        const date = new Date(ev.start_at);
        // Format HH:MM manually to avoid heavy libs
        const hours = (date.getUTCHours() + offset + 24) % 24;
        const mins = date.getUTCMinutes().toString().padStart(2, '0');
        const timeStr = ev.all_day ? "[Dia Todo]" : `${hours.toString().padStart(2, '0')}:${mins}`;

        response += `\n🕒 ${timeStr} - *${ev.title}*`;
    });

    return response;
}

export async function handleCreateEvent(
    supabase: any,
    userId: string,
    orgId: string,
    rawText: string
): Promise<string> {
    // Basic Parsing: "agendar [TITLE] [TIME_REF] [HOUR]"
    // Limitations: Very strict format for MVP.
    // Supports: "agendar [Reunião] hoje 15h" OR "agendar [Reunião] amanhã 10:30"

    const lower = rawText.toLowerCase();
    const isTomorrow = lower.includes('amanhã') || lower.includes('amanha');

    // Extract time (simple regex for HH:MM or HHh)
    const timeMatch = lower.match(/(\d{1,2})[:h](\d{2})?/);

    if (!timeMatch) {
        return "Não entendi o horário. Tente: *agendar Reunião hoje 15h* ou *amanhã 10:30*";
    }

    let hour = parseInt(timeMatch[1]);
    let min = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

    // Determine Date
    const date = new Date();
    // Sync to roughly UTC-3 context
    date.setUTCHours(date.getUTCHours() - 3);

    if (isTomorrow) {
        date.setUTCDate(date.getUTCDate() + 1);
    }

    // Set Time (User input is local time, we assume -3)
    // Storing as UTC
    // Formula: InputHour + 3 = UTC Hour (since Input is -3)
    const utcHour = hour + 3;

    // Construct Start Date
    const startAt = new Date(date);
    startAt.setUTCHours(utcHour, min, 0, 0);

    // Default duration: 1 hour
    const endAt = new Date(startAt);
    endAt.setUTCHours(startAt.getUTCHours() + 1);

    // Extract Title: Remove 'agendar', 'marcar', time references
    let title = rawText
        .replace(/agendar|marcar/yi, '')
        .replace(/hoje|amanhã|amanha/yi, '')
        .replace(/(\d{1,2})[:h](\d{2})?/gi, '') // remove time
        .trim();

    if (!title) title = "Novo Evento";
    // Title might still have 'em', 'as', 'no', etc. keeping it simple.

    const { error } = await supabase
        .from('calendar_events')
        .insert({
            org_id: orgId,
            user_id: userId,
            title: title,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            source: 'whatsapp',
            all_day: false
        });

    if (error) {
        console.error('Create Error', error);
        return "Erro ao criar evento. Tente novamente.";
    }

    const dayStr = isTomorrow ? "amanhã" : "hoje";
    return `✅ Agendado: *${title}* para ${dayStr} às ${hour}:${min.toString().padStart(2, '0')}`;
}
