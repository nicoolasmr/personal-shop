import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Calendar, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface Org {
    id: string;
    name: string;
    created_at: string;
    _count?: {
        profiles: number;
    };
}

const OpsOrgs = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data: orgs, isLoading, error } = useQuery({
        queryKey: ['ops-orgs'],
        queryFn: async () => {
            // Fetch orgs with a count of members
            const { data, error } = await supabase
                .from('orgs')
                .select(`
                    id,
                    name,
                    created_at,
                    profiles:profiles(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as any[]).map(org => ({
                ...org,
                memberCount: org.profiles?.[0]?.count || 0
            }));
        }
    });

    const deleteOrgMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('orgs')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ops-orgs'] });
            toast.success('Organização removida com sucesso');
        },
        onError: (err: any) => {
            toast.error('Erro ao remover organização: ' + err.message);
        }
    });

    const filteredOrgs = orgs?.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (isLoading) return (
        <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (error) return <div className="text-red-400 p-8 text-center">Erro ao carregar organizações.</div>;

    return (
        <div className="space-y-6 animate-smooth-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Gestão de Academias</h1>
                <div className="relative w-full sm:w-72 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar por nome..."
                        className="pl-10 bg-slate-800/50 border-slate-700 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrgs.map(org => (
                    <Card key={org.id} className="bg-slate-800/40 border-slate-700/50 hover:border-primary/30 transition-all group overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                                    <Building2 className="h-6 w-6 text-primary" />
                                </div>
                                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                                    ID: {org.id.substring(0, 8)}...
                                </Badge>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-100 group-hover:text-primary transition-colors truncate">
                                    {org.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Users className="h-3 w-3" />
                                        {org.memberCount} Membros
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(org.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" className="flex-1 rounded-lg border-slate-700 bg-slate-800/50 hover:bg-slate-700">
                                    Editar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                                    onClick={() => {
                                        if (confirm(`Tem certeza que deseja excluir a academia "${org.name}"? Esta ação é irreversível.`)) {
                                            deleteOrgMutation.mutate(org.id);
                                        }
                                    }}
                                >
                                    Excluir
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredOrgs.length === 0 && !isLoading && (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-700/50">
                    <p className="text-slate-500 font-medium italic">Nenhuma academia encontrada para "{searchTerm}".</p>
                </div>
            )}
        </div>
    );
};

export default OpsOrgs;
