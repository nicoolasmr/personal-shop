import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { AchievementsShowcase } from '@/components/home/AchievementsShowcase';
import { User, Mail, Building, Calendar, Save, Loader2, Upload } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { updateProfile, uploadAvatar, UpdateProfileData } from '@/services/user';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { profile, org, loading, refetch: refetchTenant, error, configured } = useTenant();
    const [isEditing, setIsEditing] = useState(false);
    const [nameDraft, setNameDraft] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Init draft name when editing starts
    const handleStartEdit = () => {
        setNameDraft(profile?.full_name || '');
        setIsEditing(true);
    };

    const updateProfileMutation = useMutation({
        mutationFn: async (data: UpdateProfileData) => {
            if (!user?.id) throw new Error('User not found');
            const { success, error } = await updateProfile(user.id, data);
            if (!success) throw new Error(error || 'Failed to update');
            return success;
        },
        onSuccess: () => {
            refetchTenant();
            setIsEditing(false);
            toast({ title: 'Perfil atualizado!' });
        },
        onError: (err) => {
            toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
        }
    });

    const uploadAvatarMutation = useMutation({
        mutationFn: async (file: File) => {
            if (!user?.id) throw new Error('User not found');
            const { url, error } = await uploadAvatar(user.id, file);
            if (error) throw new Error(error);
            if (!url) throw new Error('Failed to get URL');
            return url;
        },
        onSuccess: async (url) => {
            // Immediately update profile with new avatar URL
            // We preserve the current name (or draft)
            const currentName = isEditing ? nameDraft : (profile?.full_name || '');
            await updateProfileMutation.mutateAsync({ full_name: currentName, avatar_url: url });
            // Toast handled by update profile success, or distinct one here?
            // Let's rely on update profile success, or add specific one.
        },
        onError: (err) => {
            toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadAvatarMutation.mutate(file);
        }
    };

    const handleSave = () => {
        updateProfileMutation.mutate({ full_name: nameDraft });
    };

    if (!configured) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground text-center px-4">
                Supabase não configurado. Configure as variáveis de ambiente para acessar o perfil.
            </div>
        );
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    if (error) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center px-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" onClick={refetchTenant}>Tentar novamente</Button>
            </div>
        );
    }

    const userInitials = profile?.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Perfil</h1>
                    <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
                </div>
                <Button variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => signOut()}>Sair</Button>
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
                                        <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                                        <AvatarFallback className="text-2xl font-bold">{userInitials}</AvatarFallback>
                                    </Avatar>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadAvatarMutation.isPending || updateProfileMutation.isPending}
                                    >
                                        {(uploadAvatarMutation.isPending || updateProfileMutation.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Alterar Foto
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-1 text-center max-w-[150px]">
                                        Recomendado: 400x400px, máx 2MB.
                                    </p>
                                </div>

                                <div className="flex-1 space-y-4 w-full">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Nome Completo</label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={isEditing ? nameDraft : (profile?.full_name || '')}
                                                onChange={(e) => setNameDraft(e.target.value)}
                                                disabled={!isEditing}
                                            />
                                            {!isEditing ? (
                                                <Button variant="outline" size="icon" onClick={handleStartEdit}><User className="h-4 w-4" /></Button>
                                            ) : (
                                                <Button size="icon" onClick={handleSave} disabled={updateProfileMutation.isPending}>
                                                    {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/50 text-muted-foreground text-sm">
                                            <Mail className="h-4 w-4" />
                                            {user?.email}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Organização</label>
                                            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/50 text-muted-foreground text-sm">
                                                <Building className="h-4 w-4" />
                                                {org?.name || 'Carregando...'}
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium">Membro Desde</label>
                                            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-muted/50 text-muted-foreground text-sm">
                                                <Calendar className="h-4 w-4" />
                                                {new Date(profile?.created_at || Date.now()).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-medium mb-3">Segurança</h3>
                                <Button variant="outline" disabled>Alterar Senha (Em breve)</Button>
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
