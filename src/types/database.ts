export type AppRole = 'owner' | 'admin' | 'member';
export type Json = unknown;

export interface Database {
    public: {
        Tables: {
            orgs: {
                Row: { id: string; name: string; created_at: string };
                Insert: { id?: string; name: string; created_at?: string };
                Update: { id?: string; name?: string; created_at?: string };
            };
            memberships: {
                Row: { id: string; org_id: string; user_id: string; role: AppRole; created_at: string };
                Insert: { id?: string; org_id: string; user_id: string; role: AppRole; created_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; role?: AppRole; created_at?: string };
            };
            profiles: {
                Row: { user_id: string; org_id: string; full_name: string | null; email: string; avatar_url: string | null; created_at: string };
                Insert: { user_id: string; org_id: string; full_name?: string | null; email: string; avatar_url?: string | null; created_at?: string };
                Update: { user_id?: string; org_id?: string; full_name?: string | null; email?: string; avatar_url?: string | null; created_at?: string };
            };
            user_roles: {
                Row: { id: string; user_id: string; role: AppRole };
                Insert: { id?: string; user_id: string; role: AppRole };
                Update: { id?: string; user_id?: string; role?: AppRole };
            };
            audit_log: {
                Row: { id: string; org_id: string; user_id: string; action: string; entity_type: string; entity_id: string | null; meta: Record<string, unknown> | null; created_at: string };
                Insert: { id?: string; org_id: string; user_id: string; action: string; entity_type: string; entity_id?: string | null; meta?: Record<string, unknown> | null; created_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; action?: string; entity_type?: string; entity_id?: string | null; meta?: Record<string, unknown> | null; created_at?: string };
            };
            habits: {
                Row: { id: string; org_id: string; user_id: string; name: string; description: string | null; category: string | null; frequency: Json; target: number; color: string | null; active: boolean; created_at: string; updated_at: string };
                Insert: { id?: string; org_id: string; user_id: string; name: string; description?: string | null; category?: string | null; frequency?: Json; target?: number; color?: string | null; active?: boolean; created_at?: string; updated_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; name?: string; description?: string | null; category?: string | null; frequency?: Json; target?: number; color?: string | null; active?: boolean; created_at?: string; updated_at?: string };
            };
            habit_checkins: {
                Row: { id: string; org_id: string; habit_id: string; user_id: string; checkin_date: string; completed: boolean; notes: string | null; source: string; created_at: string };
                Insert: { id?: string; org_id: string; habit_id: string; user_id: string; checkin_date: string; completed?: boolean; notes?: string | null; source?: string; created_at?: string };
                Update: { id?: string; org_id?: string; habit_id?: string; user_id?: string; checkin_date?: string; completed?: boolean; notes?: string | null; source?: string; created_at?: string };
            },
            goals: {
                Row: { id: string; org_id: string; user_id: string; type: string; title: string; description: string | null; target_value: number | null; current_value: number; unit: string | null; due_date: string | null; status: string; linked_habit_id: string | null; created_at: string; updated_at: string };
                Insert: { id?: string; org_id: string; user_id: string; type: string; title: string; description?: string | null; target_value?: number | null; current_value?: number; unit?: string | null; due_date?: string | null; status?: string; linked_habit_id?: string | null; created_at?: string; updated_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; type?: string; title?: string; description?: string | null; target_value?: number | null; current_value?: number; unit?: string | null; due_date?: string | null; status?: string; linked_habit_id?: string | null; created_at?: string; updated_at?: string };
            },
            goal_progress: {
                Row: { id: string; org_id: string; goal_id: string; user_id: string; progress_date: string; delta_value: number; notes: string | null; source: string; created_at: string };
                Insert: { id?: string; org_id: string; goal_id: string; user_id: string; progress_date: string; delta_value: number; notes?: string | null; source?: string; created_at?: string };
                Update: { id?: string; org_id?: string; goal_id?: string; user_id?: string; progress_date?: string; delta_value?: number; notes?: string | null; source?: string; created_at?: string };
            },
            finance_goals: {
                Row: { id: string; org_id: string; user_id: string; name: string; type: string; current_amount: number; target_amount: number; is_active: boolean; created_at: string; updated_at: string; deadline?: string | null; category_id?: string | null };
                Insert: { id?: string; org_id: string; user_id: string; name: string; type: string; current_amount?: number; target_amount: number; is_active?: boolean; created_at?: string; updated_at?: string; deadline?: string | null; category_id?: string | null };
                Update: { id?: string; org_id?: string; user_id?: string; name?: string; type?: string; current_amount?: number; target_amount?: number; is_active?: boolean; created_at?: string; updated_at?: string; deadline?: string | null; category_id?: string | null };
            };
            transactions: {
                Row: { id: string; org_id: string; user_id: string; category_id: string | null; type: string; amount: number; description: string; transaction_date: string; installment_count: number; installment_number: number; is_installment_parcel: boolean; payment_method: string; created_at: string; updated_at: string };
                Insert: { id?: string; org_id: string; user_id: string; category_id?: string | null; type: string; amount: number; description: string; transaction_date?: string; installment_count?: number; installment_number?: number; is_installment_parcel?: boolean; payment_method?: string; created_at?: string; updated_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; category_id?: string | null; type?: string; amount?: number; description?: string; transaction_date?: string; installment_count?: number; installment_number?: number; is_installment_parcel?: boolean; payment_method?: string; created_at?: string; updated_at?: string };
            };
            transaction_categories: {
                Row: { id: string; org_id: string; name: string; type: string; color: string | null; icon: string | null; created_at: string };
                Insert: { id?: string; org_id: string; name: string; type: string; color?: string | null; icon?: string | null; created_at?: string };
                Update: { id?: string; org_id?: string; name?: string; type?: string; color?: string | null; icon?: string | null; created_at?: string };
            };
            user_settings: {
                Row: { user_id: string; monthly_goal: number; created_at: string; updated_at: string };
                Insert: { user_id: string; monthly_goal?: number; created_at?: string; updated_at?: string };
                Update: { user_id?: string; monthly_goal?: number; created_at?: string; updated_at?: string };
            };
            user_achievements: {
                Row: { id: string; user_id: string; achievement_id: string; unlocked_at: string };
                Insert: { id?: string; user_id: string; achievement_id: string; unlocked_at?: string };
                Update: { id?: string; user_id?: string; achievement_id?: string; unlocked_at?: string };
            };
            bug_reports: {
                Row: { id: string; org_id: string; user_id: string; title: string; description: string; severity: string; status: string; metadata: Json; created_at: string; updated_at: string };
                Insert: { id?: string; org_id: string; user_id: string; title: string; description: string; severity?: string; status?: string; metadata?: Json; created_at?: string; updated_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; title?: string; description?: string; severity?: string; status?: string; metadata?: Json; created_at?: string; updated_at?: string };
            },
            tasks: {
                Row: { id: string; org_id: string; user_id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; tags: string[]; sort_order: number; archived: boolean; created_at: string; updated_at: string };
                Insert: { id?: string; org_id: string; user_id: string; title: string; description?: string | null; status?: string; priority?: string; due_date?: string | null; tags?: string[]; sort_order?: number; archived?: boolean; created_at?: string; updated_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; title?: string; description?: string | null; status?: string; priority?: string; due_date?: string | null; tags?: string[]; sort_order?: number; archived?: boolean; created_at?: string; updated_at?: string };
            },
            task_subtasks: {
                Row: { id: string; org_id: string; task_id: string; user_id: string; title: string; done: boolean; created_at: string };
                Insert: { id?: string; org_id: string; task_id: string; user_id: string; title: string; done?: boolean; created_at?: string };
                Update: { id?: string; org_id?: string; task_id?: string; user_id?: string; title?: string; done?: boolean; created_at?: string };
            },
            task_attachments: {
                Row: { id: string; org_id: string; task_id: string; user_id: string; file_name: string; file_path: string; file_size: number; file_type: string; created_at: string };
                Insert: { id?: string; org_id: string; task_id: string; user_id: string; file_name: string; file_path: string; file_size: number; file_type: string; created_at?: string };
                Update: { id?: string; org_id?: string; task_id?: string; user_id?: string; file_name?: string; file_path?: string; file_size?: number; file_type?: string; created_at?: string };
            },
            push_subscriptions: {
                Row: { id: string; org_id: string; user_id: string; endpoint: string; p256dh: string; auth: string; created_at: string };
                Insert: { id?: string; org_id: string; user_id: string; endpoint: string; p256dh: string; auth: string; created_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; endpoint?: string; p256dh?: string; auth?: string; created_at?: string };
            },
            calendar_events: {
                Row: { id: string; user_id: string; org_id: string; title: string; description: string | null; location: string | null; start_at: string; end_at: string; all_day: boolean; source: string; created_at: string; updated_at: string };
                Insert: { id?: string; user_id?: string; org_id?: string; title: string; description?: string | null; location?: string | null; start_at: string; end_at: string; all_day?: boolean; source?: string; created_at?: string; updated_at?: string };
                Update: { id?: string; user_id?: string; org_id?: string; title?: string; description?: string | null; location?: string | null; start_at?: string; end_at?: string; all_day?: boolean; source?: string; created_at?: string; updated_at?: string };
            },
            calendar_reminders: {
                Row: { id: string; event_id: string; user_id: string; org_id: string; remind_at: string; channel: string; created_at: string };
                Insert: { id?: string; event_id: string; user_id?: string; org_id?: string; remind_at: string; channel?: string; created_at?: string };
                Update: { id?: string; event_id?: string; user_id?: string; org_id?: string; remind_at?: string; channel?: string; created_at?: string };
            },
            whatsapp_links: {
                Row: { id: string; user_id: string; org_id: string; phone_hash: string; phone_last4: string | null; verified: boolean; created_at: string; updated_at: string };
                Insert: { id?: string; user_id: string; org_id: string; phone_hash: string; phone_last4?: string | null; verified?: boolean; created_at?: string; updated_at?: string };
                Update: { id?: string; user_id?: string; org_id?: string; phone_hash?: string; phone_last4?: string | null; verified?: boolean; created_at?: string; updated_at?: string };
            },
            whatsapp_messages_log: {
                Row: { id: string; user_id: string | null; org_id: string | null; direction: string; message_type: string; intent: string | null; status: string; error_code: string | null; created_at: string };
                Insert: { id?: string; user_id?: string | null; org_id?: string | null; direction: string; message_type: string; intent?: string | null; status: string; error_code?: string | null; created_at?: string };
                Update: { id?: string; user_id?: string | null; org_id?: string | null; direction?: string; message_type?: string; intent?: string | null; status?: string; error_code?: string | null; created_at?: string };
            },
            whatsapp_conversation_state: {
                Row: { id: string; user_id: string; phone_hash: string; state: Json; last_interaction_at: string; updated_at: string };
                Insert: { id?: string; user_id: string; phone_hash: string; state?: Json; last_interaction_at?: string; updated_at?: string };
                Update: { id?: string; user_id?: string; phone_hash?: string; state?: Json; last_interaction_at?: string; updated_at?: string };
            },
            whatsapp_verification_codes: {
                Row: { code: string; user_id: string; org_id: string; created_at: string; expires_at: string };
                Insert: { code: string; user_id?: string; org_id: string; created_at?: string; expires_at: string };
                Update: { code?: string; user_id?: string; org_id?: string; created_at?: string; expires_at?: string };
            };
        };
        Functions: {
            has_role: { Args: { _user_id: string; _role: AppRole }; Returns: boolean };
            is_org_member: { Args: { _user_id: string; _org_id: string }; Returns: boolean };
            generate_installment_parcels: { Args: { p_parent_id: string, p_installment_count: number }; Returns: void };
            get_monthly_summary: { Args: { p_org_id: string, p_user_id: string, p_year?: number, p_month?: number }; Returns: unknown };
            get_category_breakdown: { Args: { p_org_id: string, p_user_id: string, p_type: string, p_year?: number, p_month?: number }; Returns: unknown };
        };
    };
}
