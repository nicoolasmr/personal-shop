
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Define the type for a bug report
interface Bug {
    id: string;
    title: string | null;
    severity: 'critical' | 'high' | 'medium' | 'low'; // Example severities, adjust as per actual data
    status: 'open' | 'resolved' | 'in-progress' | 'new'; // Example statuses, adjust as per actual data
    route: string;
    created_at: string; // ISO date string
    description: string;
    // Add any other properties that the bug object might have
}

const Bugs = () => {
    const { data: bugs, isLoading, error } = useQuery<Bug[]>({ // Specify the type for data
        queryKey: ['ops-bugs'],
        queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('ops-bugs', {
                method: 'POST',
                body: { action: 'list' }
            });
            if (error) throw error;
            // Assuming data.data is an array of Bug objects
            return data.data as Bug[];
        }
    });

    if (isLoading) return <div className="text-slate-500">Loading bug reports...</div>;
    if (error) return <div className="text-red-400">Error loading bugs. Checks permissions.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-4">Bug Queue</h1>

            <div className="space-y-4">
                {bugs?.map(bug => (
                    <Card key={bug.id} className="bg-slate-800 border-slate-700 p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-slate-200 font-bold text-lg">{bug.title || 'Untitled Bug'}</h3>
                                <div className="flex gap-2 mt-1">
                                    <Badge variant={bug.severity === 'critical' ? 'destructive' : 'secondary'}>{bug.severity}</Badge>
                                    <Badge variant="outline">{bug.status}</Badge>
                                    <span className="text-xs text-slate-500 self-center">Route: {bug.route}</span>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500 font-mono">
                                {new Date(bug.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mb-4 whitespace-pre-wrap">{bug.description}</p>

                        <div className="flex gap-2 justify-end border-t border-slate-700 pt-3">
                            {/* Future: Actions to change status via ops-bugs POST */}
                            <Button variant="ghost" size="sm" className="text-slate-400" disabled>Mark Resolved</Button>
                        </div>
                    </Card>
                ))}
            </div>
            {(!bugs || bugs.length === 0) && <div className="text-slate-600">No active bug reports.</div>}
        </div>
    );
};

export default Bugs;
