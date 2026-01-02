import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_SAVINGS_GOALS, type CreateSavingsGoalPayload } from '@/types/finance';

interface SavingsGoalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (payload: CreateSavingsGoalPayload) => void;
}

export function SavingsGoalDialog({ open, onOpenChange, onSubmit }: SavingsGoalDialogProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [icon, setIcon] = useState('🎯');
    const [color, setColor] = useState('#8B5CF6');

    const handleTemplateSelect = (template: typeof DEFAULT_SAVINGS_GOALS[0]) => {
        setSelectedTemplate(template.name);
        setName(template.name);
        setDescription(template.description);
        setIcon(template.icon);
        setColor(template.color);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(targetAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, insira um valor válido');
            return;
        }

        onSubmit({
            name,
            description,
            target_amount: amount,
            icon,
            color,
        });

        // Reset form
        setSelectedTemplate(null);
        setName('');
        setDescription('');
        setTargetAmount('');
        setIcon('🎯');
        setColor('#8B5CF6');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Meta de Economia</DialogTitle>
                    <DialogDescription>
                        Defina uma meta de economia mensal para alcançar seus objetivos financeiros
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Templates */}
                    <div className="space-y-3">
                        <Label>Escolha um modelo (opcional)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {DEFAULT_SAVINGS_GOALS.map((template) => (
                                <button
                                    key={template.name}
                                    type="button"
                                    onClick={() => handleTemplateSelect(template)}
                                    className={`p-3 border rounded-lg hover:bg-muted/50 transition-colors text-center ${selectedTemplate === template.name ? 'border-primary bg-primary/10' : ''
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{template.icon}</div>
                                    <div className="text-xs font-medium line-clamp-2">{template.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Fields */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-[60px_1fr] gap-3">
                            <div>
                                <Label htmlFor="icon">Ícone</Label>
                                <Input
                                    id="icon"
                                    value={icon}
                                    onChange={(e) => setIcon(e.target.value)}
                                    className="text-center text-2xl"
                                    maxLength={2}
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Nome da Meta *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Viagem em Família"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descreva sua meta..."
                                rows={2}
                            />
                        </div>

                        <div>
                            <Label htmlFor="targetAmount">Valor Mensal *</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    R$
                                </span>
                                <Input
                                    id="targetAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={targetAmount}
                                    onChange={(e) => setTargetAmount(e.target.value)}
                                    placeholder="0,00"
                                    className="pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Quanto você pretende economizar por mês para esta meta?
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="color">Cor</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-20 h-10"
                                />
                                <Input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">Criar Meta</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
