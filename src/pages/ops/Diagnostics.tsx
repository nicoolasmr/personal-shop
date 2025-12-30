
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const Diagnostics = () => {
    const { data: events, isLoading, error } = useQuery({
        queryKey: ['ops-diagnostics'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('ops-diagnostics', {
                method: 'POST',
                body: { action: 'list' }
            });
            if (error) throw error;
            return data.data as any[];
        }
    });

    if (isLoading) return <div className="text-slate-500">Loading system status...</div>;
    if (error) return <div className="text-red-400">Error loading diagnostics.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-4">System Diagnostics</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-slate-800 border-slate-700 p-4">
                    <h3 className="text-xs text-slate-400 mb-2">INTEGRITY</h3>
                    <div className="text-2xl font-mono text-emerald-400">OK</div>
                </Card>
                <Card className="bg-slate-800 border-slate-700 p-4">
                    <h3 className="text-xs text-slate-400 mb-2">EVENTS (24h)</h3>
                    <div className="text-2xl font-mono text-slate-200">{events?.length || 0}</div>
                </Card>
                <Card className="bg-slate-800 border-slate-700 p-4">
                    <h3 className="text-xs text-slate-400 mb-2">CRITICAL</h3>
                    <div className="text-2xl font-mono text-slate-200">
                        {events?.filter(e => e.severity === 'critical').length || 0}
                    </div>
                </Card>
            </div>

            <ScrollArea className="h-[500px] border border-slate-700 rounded bg-slate-900 p-4">
                <div className="space-y-2 font-mono text-xs">
                    {events?.map(e => (
                        <div key={e.id} className="flex gap-4 border-b border-slate-800 pb-2">
                            <span className="text-slate-500 w-32 shrink-0">{new Date(e.created_at).toLocaleString()}</span>
                            <Badge
                                variant="outline"
                                className={`w-20 justify-center shrink-0 ${e.severity === 'critical' ? 'border-red-500 text-red-400' :
                                        e.severity === 'error' ? 'border-orange-500 text-orange-400' :
                                            'border-slate-700 text-slate-400'
                                    }`}
                            >
                                {e.severity}
                            </Badge>
                            <span className="text-cyan-400 shrink-0 w-32">{e.event_type}</span>
                            <span className="text-slate-300 break-all">{JSON.stringify(e.meta)}</span>
                        </div>
                    ))}
                    {(!events || events.length === 0) && <div className="text-slate-600 italic">No diagnostic events found.</div>}
                </div>
            </ScrollArea>
        </div>
    );
};

export default Diagnostics;
