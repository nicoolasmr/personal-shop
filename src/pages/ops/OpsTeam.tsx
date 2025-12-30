
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const OpsTeam = () => {
    const { user } = useAuth(); // We might check role here client side too to hide UI
    const [targetId, setTargetId] = useState('');
    const [role, setRole] = useState<'team' | 'admin' | 'user'>('team');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const handleUpdate = async () => {
        setLoading(true);
        setMsg('');
        try {
            const { error } = await supabase.functions.invoke('ops-team', {
                method: 'POST',
                body: { action: 'set_role', targetId, newRole: role }
            });
            if (error) throw error;
            setMsg('Success: Role updated.');
        } catch (e) {
            setMsg('Error: ' + (e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-xl">
            <h1 className="text-2xl font-bold text-slate-100 mb-4">Staff Management (Admin Only)</h1>

            <Card className="bg-slate-800 border-slate-700 p-6 space-y-4">
                <div>
                    <label className="text-xs text-slate-400 block mb-1">Target User ID (UUID)</label>
                    <Input
                        value={targetId}
                        onChange={e => setTargetId(e.target.value)}
                        placeholder="00000000-0000-..."
                        className="bg-slate-900 border-slate-600 text-slate-200"
                    />
                </div>
                <div>
                    <label className="text-xs text-slate-400 block mb-1">New Role</label>
                    <div className="flex gap-2">
                        {['user', 'team', 'admin'].map(r => (
                            <Button
                                key={r}
                                variant={role === r ? 'default' : 'outline'}
                                onClick={() => setRole(r as any)}
                                size="sm"
                            >
                                {r.toUpperCase()}
                            </Button>
                        ))}
                    </div>
                </div>

                <Button
                    onClick={handleUpdate}
                    disabled={!targetId || loading}
                    className="w-full"
                >
                    {loading ? 'Processing...' : 'Update Role'}
                </Button>

                {msg && <p className={`text-sm ${msg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>{msg}</p>}
            </Card>

            <p className="text-xs text-slate-500">
                Warning: Updating a role allows immediate access to corresponding resources.
                This action is logged.
            </p>
        </div>
    );
};

export default OpsTeam;
