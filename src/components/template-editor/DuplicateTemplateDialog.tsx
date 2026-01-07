/**
 * Dialog pour dupliquer un template existant
 */

import { useState } from 'react';
import { Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import type { PDFTemplate } from '@/types/template-editor';
import { toast } from 'sonner';

interface DuplicateTemplateDialogProps {
  template: PDFTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateTemplateDialog({ 
  template, 
  open, 
  onOpenChange 
}: DuplicateTemplateDialogProps) {
  const [name, setName] = useState(`${template.name} (copie)`);
  const [description, setDescription] = useState(template.description);
  const [includeAllVersions, setIncludeAllVersions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { duplicateTemplate } = useTemplateEditorStore();

  const handleDuplicate = async () => {
    if (!name.trim()) {
      toast.error('Le nom du template est requis');
      return;
    }

    setIsLoading(true);
    try {
      const newTemplate = duplicateTemplate(template.id, name.trim(), description, includeAllVersions);
      if (newTemplate) {
        toast.success(`Template "${newTemplate.name}" créé avec succès`);
        onOpenChange(false);
      } else {
        toast.error('Erreur lors de la duplication');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Dupliquer le template
          </DialogTitle>
          <DialogDescription>
            Créez une copie de "{template.name}" avec un nouveau nom.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom du template *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nouveau nom du template"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeVersions"
              checked={includeAllVersions}
              onCheckedChange={(checked) => setIncludeAllVersions(checked === true)}
            />
            <Label htmlFor="includeVersions" className="text-sm font-normal">
              Inclure toutes les versions (sinon, seule la dernière publiée sera copiée)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleDuplicate} disabled={isLoading || !name.trim()}>
            {isLoading ? 'Duplication...' : 'Dupliquer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
