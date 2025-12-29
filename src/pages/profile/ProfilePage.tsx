import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/hooks/useTenant';
import { AchievementsShowcase } from '@/components/home/AchievementsShowcase';
import { User, Mail, Building, Calendar, Save } from 'lucide-react';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { profile, org, loading } = useTenant();
    const [isEditing, setIsEditing] = useState(false);

    // Placeholder function for update, integration would require actual service call
    const handleSave = () => { setIsEditing(false); alert('Perfil atualizado (simulação)'); }

    if (loading) return <div>Carregando perfil...</div>;

    const userInitials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Perfil</h1>
                    <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
                </div>
                <Button variant="outline" className="text-red-500 hover:text-red-700" onClick={() => signOut()}>Sair</Button>
            </div>

            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
                    <TabsTrigger value="achievements">Conquistas</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Pessoais</CardTitle>
                            <CardDescription>Visualize e edite seus dados de perfil</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <div className="flex flex-col items-center gap-2">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={profile?.avatar_url || ''} />
                                        <AvatarFallback className="text-2xl font-bold">{userInitials}</AvatarFallback>
                                    </Avatar>
                                    <Button variant="outline" size="sm">Alterar Foto</Button>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Nome Completo</label>
                                        <div className="flex gap-2">
                                            <Input defaultValue={profile?.full_name || ''} disabled={!isEditing} />
                                            {!isEditing ? (
                                                <Button variant="outline" size="icon" onClick={() => setIsEditing(true)}><User className="h-4 w-4" /></Button>
                                            ) : (
                                                <Button size="icon" onClick={handleSave}><Save className="h-4 w-4" /></Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm">
                                            <Mail className="h-4 w-4" />
                                            {user?.email}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Organização</label>
                                            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm">
                                                <Building className="h-4 w-4" />
                                                {org?.name || 'Carregando...'}
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Membro Desde</label>
                                            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted text-muted-foreground text-sm">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-medium mb-2">Segurança</h3>
                                <Button variant="outline">Alterar Senha</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="achievements" className="pt-4">
                    <AchievementsShowcase />
                </TabsContent>
            </Tabs>
        </div>
    );
}
