import { describe, expect, it, vi } from 'vitest';
import { fetchTenantSnapshot } from './useTenant';

type QueryResponse = { data?: unknown; error?: Error | null };

type SupabaseMock = {
    from: (table: 'profiles' | 'orgs') => {
        select: () => SupabaseMock['from'] extends (arg: any) => infer R ? R : never;
        eq: () => SupabaseMock['from'] extends (arg: any) => infer R ? R : never;
        maybeSingle: () => Promise<QueryResponse>;
    };
};

const makeQuery = (response: QueryResponse) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(response),
});

const makeSupabase = (responses: Record<'profiles' | 'orgs', QueryResponse>): SupabaseMock => ({
    from: (table: 'profiles' | 'orgs') => makeQuery(responses[table]),
});

describe('fetchTenantSnapshot', () => {
    it('returns configuration error when supabase is not configured', async () => {
        const result = await fetchTenantSnapshot({ configured: false, supabaseClient: null, userId: null });
        expect(result.error).toBe('Supabase não configurado');
        expect(result.profile).toBeNull();
        expect(result.org).toBeNull();
    });

    it('returns empty state when user is missing', async () => {
        const result = await fetchTenantSnapshot({ configured: true, supabaseClient: null, userId: null });
        expect(result.error).toBeNull();
        expect(result.profile).toBeNull();
    });

    it('propagates errors from Supabase queries', async () => {
        const supabase = makeSupabase({ profiles: { error: new Error('network') }, orgs: {} });
        const result = await fetchTenantSnapshot({ configured: true, supabaseClient: supabase, userId: 'u1' });
        expect(result.error).toBe('network');
    });

    it('returns explicit error when profile exists but org is missing', async () => {
        const supabase = makeSupabase({ profiles: { data: { org_id: 'org-1' } }, orgs: { data: null } });
        const result = await fetchTenantSnapshot({ configured: true, supabaseClient: supabase, userId: 'u1' });
        expect(result.error).toBe('Organização não encontrada para o perfil atual');
        expect(result.profile).not.toBeNull();
    });
});
