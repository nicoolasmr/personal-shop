
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

// Types derived from Database definition
export type CalendarEvent = Database['public']['Tables']['calendar_events']['Row'];
export type CalendarReminder = Database['public']['Tables']['calendar_reminders']['Row'];

export interface CreateEventPayload {
    title: string;
    description?: string;
    location?: string;
    start_at: Date;
    end_at: Date;
    all_day?: boolean;
    color?: string;
    source?: 'manual' | 'whatsapp' | 'system';
}

export interface UpdateEventPayload extends Partial<CreateEventPayload> {
    id: string;
}

export const calendarService = {
    /**
     * List events within a date range.
     * Use ISO strings for robust querying.
     */
    async listEvents(start: Date, end: Date) {
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .gte('end_at', start.toISOString())
            .lte('start_at', end.toISOString())
            .order('start_at', { ascending: true });

        if (error) throw error;
        return data as CalendarEvent[];
    },

    /**
     * Create a new event. 
     * Note: user_id and org_id are handled by RLS/Triggers explicitly.
     */
    async createEvent(payload: CreateEventPayload) {
        // org_id will be set by DB trigger
        // user_id will be set by DB default (auth.uid())
        const { data, error } = await supabase
            .from('calendar_events')
            .insert({
                title: payload.title,
                description: payload.description,
                location: payload.location,
                start_at: payload.start_at.toISOString(),
                end_at: payload.end_at.toISOString(),
                all_day: payload.all_day ?? false,
                color: payload.color || 'blue',
                source: payload.source ?? 'manual'
            })
            .select()
            .single();

        if (error) throw error;
        return data as CalendarEvent;
    },



    /**
     * Update an existing event.
     */
    async updateEvent(id: string, payload: Partial<CreateEventPayload>) {
        const updateData: any = { ...payload };

        // Convert dates to ISO if present
        if (payload.start_at) updateData.start_at = payload.start_at.toISOString();
        if (payload.end_at) updateData.end_at = payload.end_at.toISOString();

        const { data, error } = await supabase
            .from('calendar_events')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CalendarEvent;
    },

    /**
     * Delete an event.
     */
    async deleteEvent(id: string) {
        const { error } = await supabase
            .from('calendar_events')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
