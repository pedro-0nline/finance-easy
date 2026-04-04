import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CategoryIcon, availableIcons, getIconComponent } from '@/components/CategoryIcon';
import { useAddCustomCategory } from '@/hooks/useCategories';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const presetColors = ['#E85D30', '#E84D6B', '#22C55E', '#3B82F6', '#A855F7', '#EAB308', '#F97316', '#06B6D4', '#EC4899', '#8B5CF6'];

export function AddCategoryDialog({ onCreated }: { onCreated?: (slug: string) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#3B82F6');
  const addCategory = useAddCustomCategory();

  const slug = label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const handleSave = async () => {
    if (!label.trim() || !slug) {
      toast.error('Insira um nome para a categoria');
      return;
    }
    try {
      await addCategory.mutateAsync({ slug, label: label.trim(), icon, color });
      toast.success('Categoria criada!');
      onCreated?.(slug);
      setLabel('');
      setIcon('Tag');
      setColor('#3B82F6');
      setOpen(false);
    } catch (e: any) {
      if (e?.message?.includes('duplicate')) {
        toast.error('Essa categoria já existe');
      } else {
        toast.error('Erro ao criar categoria');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus size={14} /> Nova Categoria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Pets" />
          </div>

          <div>
            <Label>Cor</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-1.5 mt-1 max-h-32 overflow-y-auto">
              {availableIcons.map((name) => {
                const IC = getIconComponent(name);
                return (
                  <button
                    key={name}
                    className={`p-1.5 rounded-md border transition-all ${icon === name ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'}`}
                    onClick={() => setIcon(name)}
                  >
                    <IC size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Preview:</span>
            <CategoryIcon icon={icon} color={color} size={20} />
            <span className="text-sm font-medium">{label || '...'}</span>
          </div>

          <Button className="w-full" onClick={handleSave} disabled={addCategory.isPending || !label.trim()}>
            Criar Categoria
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
