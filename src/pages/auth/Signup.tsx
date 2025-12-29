import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName }
            }
        });
        if (error) {
            alert(error.message);
        } else {
            alert('Cadastro realizado! Verifique seu email ou faça login.');
            navigate('/login');
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen items-center justify-center bg-muted/50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
                    <CardDescription>Comece a transformar sua vida hoje</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nome Completo</label>
                            <Input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Seu Nome" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Senha</label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                        </div>
                        <Button className="w-full" disabled={loading}>
                            {loading ? 'Cadastrando...' : 'Cadastrar'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Já tem uma conta? <Link to="/login" className="text-primary hover:underline">Entre</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
