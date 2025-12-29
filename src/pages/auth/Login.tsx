import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            alert(error.message);
        } else {
            navigate('/app/home');
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">VIDA360</CardTitle>
                    <CardDescription>Entre para continuar sua jornada</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Senha</label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <Button className="w-full" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Não tem uma conta? <Link to="/signup" className="text-primary hover:underline">Cadastre-se</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
