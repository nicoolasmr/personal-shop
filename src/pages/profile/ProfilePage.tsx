import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { AchievementsShowcase } from '@/components/home/AchievementsShowcase';
import { User, Mail, Building, Calendar, Save, Loader2, Upload, Phone, Briefcase, Clock, Lock, Settings } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { updateProfile, uploadAvatar, UpdateProfileData } from '@/services/user';
import { useToast } from '@/hooks/use-toast';
import { ProfilePreferences } from '@/components/profile/ProfilePreferences';
import { ChangePasswordDialog } from '@/components/profile/ChangePasswordDialog';

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { profile, org, loading, refetch: refetchTenant, error, configured } = useTenant();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<UpdateProfileData>({ full_name: '' });
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Init draft name when editing starts
    const handleStartEdit = () => {
        setFormData({
            full_name: profile?.full_name || '',
            age: profile?.age,
            profession: profile?.profession,
            routine: profile?.routine,
            phone: profile?.phone
        });
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
            console.log('[Profile] Uploading avatar for user:', user.id);
            const { url, error } = await uploadAvatar(user.id, file);
            if (error) {
                console.error('[Profile] Upload error:', error);
                throw new Error(error);
            }
            if (!url) throw new Error('Failed to get public URL for avatar');
            console.log('[Profile] Avatar uploaded, URL:', url);
            return url;
        },
        onSuccess: async (url) => {
            // Immediately update profile with new avatar URL
            const currentData = isEditing ? formData : { full_name: profile?.full_name || '' };
            await updateProfileMutation.mutateAsync({ ...currentData, avatar_url: url });
            toast({
                title: 'Foto atualizada!',
                description: 'Sua foto de perfil foi alterada com sucesso.'
            });
        },
        onError: (err: any) => {
            toast({
                title: 'Erro no upload',
                description: err.message || 'Verifique o formato e tamanho da imagem.',
                variant: 'destructive'
            });
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Basic size check (2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast({ title: 'Arquivo muito grande', description: 'O limite é 2MB.', variant: 'destructive' });
                return;
            }
            uploadAvatarMutation.mutate(file);
        }
    };

    const handleSave = () => {
        updateProfileMutation.mutate(formData);
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
                <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
                    <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
                    <TabsTrigger value="preferences">Preferências</TabsTrigger>
                    <TabsTrigger value="achievements">Conquistas</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Pessoais</CardTitle>
                            <CardDescription>Visualize e edite seus dados de perfil</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            <div className="flex flex-col items-center sm:flex-row sm:items-start gap-10">
                                {/* Centered Avatar Section with Premium Effects */}
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-indigo-600 rounded-full opacity-60 group-hover:opacity-100 blur transition duration-500"></div>
                                        <Avatar className="h-32 w-32 border-4 border-background relative">
                                            <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                                            <AvatarFallback className="text-3xl font-black bg-muted text-muted-foreground">{userInitials}</AvatarFallback>
                                        </Avatar>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute bottom-1 right-1 h-9 w-9 rounded-full shadow-lg border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadAvatarMutation.isPending}
                                        >
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="mt-4 flex flex-col items-center gap-3">
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
                                            className="h-9 px-4 rounded-full font-bold text-xs uppercase tracking-wider"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadAvatarMutation.isPending || updateProfileMutation.isPending}
                                        >
                                            {(uploadAvatarMutation.isPending || updateProfileMutation.isPending) ? (
                                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                            ) : (
                                                <Upload className="mr-2 h-3 w-3" />
                                            )}
                                            Alterar Foto
                                        </Button>
                                        <p className="text-[10px] text-muted-foreground font-medium text-center uppercase tracking-widest leading-relaxed">
                                            JPEG, PNG ou WEBP<br />
                                            Máx. 2MB
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6 w-full">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Nome Completo</label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={isEditing ? formData.full_name : (profile?.full_name || '')}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Seu nome"
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

                                    {/* Campos Estendidos */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium flex items-center gap-2"><Phone className="h-3 w-3" /> Telefone (WhatsApp)</label>
                                            <Input
                                                value={isEditing ? (formData.phone || '') : (profile?.phone || '')}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="+55 11 99999-9999"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium flex items-center gap-2"><Calendar className="h-3 w-3" /> Idade</label>
                                            <Input
                                                type="number"
                                                value={isEditing ? (formData.age || '') : (profile?.age || '')}
                                                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                                                disabled={!isEditing}
                                                placeholder="Anos"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium flex items-center gap-2"><Briefcase className="h-3 w-3" /> Profissão</label>
                                            <Input
                                                value={isEditing ? (formData.profession || '') : (profile?.profession || '')}
                                                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Ex: Engenheiro"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-medium flex items-center gap-2"><Clock className="h-3 w-3" /> Rotina</label>
                                            <Input
                                                value={isEditing ? (formData.routine || '') : (profile?.routine || '')}
                                                onChange={(e) => setFormData({ ...formData, routine: e.target.value })}
                                                disabled={!isEditing}
                                                placeholder="Ex: Corrida matinal, Trabalho 9-18h"
                                            />
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
                                <h3 className="font-medium mb-3 flex items-center gap-2"><Lock className="h-4 w-4" /> Segurança</h3>
                                <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>Alterar Senha</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="pt-4">
                    <ProfilePreferences initialLanguage={profile?.language} />
                </TabsContent>

                <TabsContent value="achievements" className="pt-4">
                    <AchievementsShowcase />
                </TabsContent>
            </Tabs>

            <ChangePasswordDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
        </div>
    );
}
