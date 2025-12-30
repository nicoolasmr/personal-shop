
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { ShieldCheck, DollarSign, Activity } from 'lucide-react';

const Billing = () => {
    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['ops-billing'],
        queryFn: async () => {
            // We call the RPC directly.
            const { data, error } = await supabase.rpc('ops_billing_stats');
            if (error) throw error;
            return data as {
                total_revenue: number;
                current_mrr_est: number;
                recent_tx_volume: number;
                generated_at: string;
            };
        },
        // Only run if user likely has permission (handled by Guard upstream, but safety is good)
    });

    if (isLoading) return <div className="text-slate-500">Calculating financial aggregates...</div>;
    if (error) return <div className="text-red-400">Error: Access Denied to Financial Data.</div>;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-4">Financial Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-800 border-slate-700 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-emerald-400">
                            <DollarSign size={20} />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Est. MRR (30d)</h3>
                        </div>
                        <div className="text-4xl font-mono text-slate-100">
                            {formatCurrency(stats?.current_mrr_est || 0)}
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-2">
                        Trailing 30 days income
                    </div>
                </Card>

                <Card className="bg-slate-800 border-slate-700 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <ShieldCheck size={20} />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Lifetime Revenue</h3>
                        </div>
                        <div className="text-4xl font-mono text-slate-100">
                            {formatCurrency(stats?.total_revenue || 0)}
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-2">
                        Total confirmed income
                    </div>
                </Card>

                <Card className="bg-slate-800 border-slate-700 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-purple-400">
                            <Activity size={20} />
                            <h3 className="text-sm font-bold uppercase tracking-wider">Volume (24h)</h3>
                        </div>
                        <div className="text-4xl font-mono text-slate-100">
                            {stats?.recent_tx_volume || 0}
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-slate-500 border-t border-slate-700 pt-2">
                        Transactions last 24 hours
                    </div>
                </Card>
            </div>

            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded text-xs text-slate-600 font-mono text-center">
                Data generated at: {stats?.generated_at ? new Date(stats.generated_at).toLocaleString() : '...'}
                <br />
                Privileged Access Logged.
            </div>
        </div>
    );
};

export default Billing;
