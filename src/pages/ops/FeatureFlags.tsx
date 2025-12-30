
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

const FeatureFlags = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Only Admin/Team should see this (Guard upstream protects it)

    // Fetch flags directly from DB
    const { data: flags, isLoading, error } = useQuery({
        queryKey: ['feature-flags'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .order('key');
            if (error) throw error;
            return data;
        }
    });

    const toggleFlagMutation = useMutation({
        mutationFn: async ({ id, is_enabled }: { id: string, is_enabled: boolean }) => {
            const { error } = await supabase
                .from('feature_flags')
                .update({ is_enabled })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
            // Since we use realtime in useFeatureFlag hook, that will update automatically,
            // but invalidating the list view is good practice.
        }
    });

    if (isLoading) return <div className="text-slate-500">Loading control panel...</div>;
    if (error) return <div className="text-red-400">Error loading flags.</div>;

    return (
        <div className="space-y-6 max-w-3xl">
            <h1 className="text-2xl font-bold text-slate-100 mb-4">Feature Control</h1>

            <div className="grid gap-4">
                {flags?.map(flag => (
                    <Card key={flag.id} className="bg-slate-800 border-slate-700 p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-200">{flag.key}</span>
                                {flag.is_enabled ?
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none">ON</Badge> :
                                    <Badge variant="outline" className="text-slate-500 border-slate-700">OFF</Badge>
                                }
                            </div>
                            <p className="text-sm text-slate-400">{flag.description}</p>
                            <div className="text-xs text-slate-600 font-mono">
                                Last updated: {new Date(flag.updated_at).toLocaleString()}
                            </div>
                        </div>

                        <div>
                            <Switch
                                checked={flag.is_enabled}
                                onCheckedChange={(checked) => toggleFlagMutation.mutate({ id: flag.id, is_enabled: checked })}
                                disabled={toggleFlagMutation.isPending}
                            />
                        </div>
                    </Card>
                ))}
            </div>

            <p className="text-xs text-slate-500 mt-4">
                Changes propagate in real-time to all connected clients.
                Use with caution.
            </p>
        </div>
    );
};

export default FeatureFlags;
