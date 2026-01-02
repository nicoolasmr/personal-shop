
import { Shield, Terminal, Zap, Activity, Server, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const OpsHome = () => {
    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative p-10 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center gap-10">
                    <div className="h-24 w-24 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <Shield className="h-12 w-12 text-emerald-500" />
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black tracking-tight text-white uppercase italic">Central de Comando</h1>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                            Infraestrutura VIDA360 operando em nível nominal. Todos os sistemas de segurança e monitoramento de transações estão ativos.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-none px-3 py-1 font-mono uppercase tracking-widest text-[10px]">AUTH_MODE: RBAC_STRICT</Badge>
                            <Badge className="bg-blue-500/10 text-blue-400 border-none px-3 py-1 font-mono uppercase tracking-widest text-[10px]">CLOUD: SUPABASE_EDGE_ACTIVE</Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Latency', value: '14ms', icon: Zap, color: 'text-amber-400' },
                    { label: 'Uptime', value: '99.98%', icon: Activity, color: 'text-emerald-400' },
                    { label: 'Instances', value: 'v2.4.0', icon: Server, color: 'text-blue-400' },
                    { label: 'DB Health', value: 'Healthy', icon: Database, color: 'text-cyan-400' },
                ].map((stat) => (
                    <Card key={stat.label} className="bg-slate-900/50 border-slate-800 overflow-hidden group hover:border-slate-700 transition-all">
                        <CardContent className="p-6 flex items-center gap-5">
                            <div className={`p-3 rounded-xl bg-slate-800/50 ${stat.color} group-hover:scale-110 transition-transform`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</p>
                                <p className="text-lg font-black text-slate-200 font-mono tracking-tighter">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-slate-950 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">System Logs / Live Stream</span>
                    </div>
                    <CardContent className="p-6 font-mono text-xs space-y-3 h-64 overflow-y-auto custom-scrollbar">
                        <p className="text-slate-500">[10:0.012] <span className="text-emerald-500">INIT</span> Protocolo de auditoria carregado...</p>
                        <p className="text-slate-500">[10:0.045] <span className="text-blue-500">SYNC</span> Sincronizando metas financeiras globais...</p>
                        <p className="text-slate-500">[10:1.321] <span className="text-amber-500">WARN</span> Tentativa de acesso bloqueado em /api/internal/secrets (ID: anonymous)</p>
                        <p className="text-slate-500">[10:4.102] <span className="text-emerald-500">OK</span> Healthcheck em Edge Functions bem sucedido (7/7)</p>
                        <p className="text-slate-500">[10:8.001] <span className="text-slate-400">INFO</span> Cache de faturamento invalidado forçadamente pelo cron.</p>
                        <div className="animate-pulse flex items-center gap-2">
                            <span className="w-2 h-4 bg-emerald-500" />
                            <span className="text-slate-600">Waiting for live data...</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-900/10 to-slate-900 border-slate-800 p-8 rounded-3xl h-full flex flex-col justify-center gap-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto border border-slate-700">
                            <Zap className="h-8 w-8 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-black text-white italic">Quick Triage</h3>
                        <p className="text-sm text-slate-400">Detectamos 3 bugs não priorizados na última hora. Deseja realizar a auditoria rápida?</p>
                        <button className="mt-4 px-6 py-3 bg-white text-slate-900 rounded-xl font-black uppercase text-xs hover:bg-emerald-400 transition-colors">Iniciar Diagnóstico</button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OpsHome;
