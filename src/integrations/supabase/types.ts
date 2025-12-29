export type AppRole = 'owner' | 'admin' | 'member';

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
                Row: { id: string; org_id: string; user_id: string; name: string; description: string | null; category: string | null; frequency: { type: 'daily' | 'weekly'; daysOfWeek?: number[] }; target: number; color: string | null; active: boolean; created_at: string; updated_at: string };
                Insert: { id?: string; org_id: string; user_id: string; name: string; description?: string | null; category?: string | null; frequency?: { type: 'daily' | 'weekly'; daysOfWeek?: number[] }; target?: number; color?: string | null; active?: boolean; created_at?: string; updated_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; name?: string; description?: string | null; category?: string | null; frequency?: { type: 'daily' | 'weekly'; daysOfWeek?: number[] }; target?: number; color?: string | null; active?: boolean; created_at?: string; updated_at?: string };
            };
            habit_checkins: {
                Row: { id: string; org_id: string; habit_id: string; user_id: string; checkin_date: string; completed: boolean; notes: string | null; source: string; created_at: string };
                Insert: { id?: string; org_id: string; habit_id: string; user_id: string; checkin_date: string; completed?: boolean; notes?: string | null; source?: string; created_at?: string };
                Update: { id?: string; org_id?: string; habit_id?: string; user_id?: string; checkin_date?: string; completed?: boolean; notes?: string | null; source?: string; created_at?: string };
            };
            // Adding Finance & Settings tables as they are used in services but missed in previous update
            finance_goals: {
                Row: { id: string; org_id: string; user_id: string; name: string; type: string; current_amount: number; target_amount: number; is_active: boolean; created_at: string; updated_at: string };
                Insert: { id?: string; org_id: string; user_id: string; name: string; type: string; current_amount?: number; target_amount: number; is_active?: boolean; created_at?: string; updated_at?: string };
                Update: { id?: string; org_id?: string; user_id?: string; name?: string; type?: string; current_amount?: number; target_amount?: number; is_active?: boolean; created_at?: string; updated_at?: string };
            };
            transactions: {
                Row: { id: string; org_id: string; user_id: string; type: string; amount: number; description: string; transaction_date: string; created_at: string; installment_count?: number; installment_number?: number; is_installment_parcel?: boolean };
                Insert: { id?: string; org_id: string; user_id: string; type: string; amount: number; description: string; transaction_date?: string; created_at?: string; installment_count?: number; installment_number?: number; is_installment_parcel?: boolean };
                Update: { id?: string; org_id?: string; user_id?: string; type?: string; amount?: number; description?: string; transaction_date?: string; created_at?: string; installment_count?: number; installment_number?: number; is_installment_parcel?: boolean };
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
