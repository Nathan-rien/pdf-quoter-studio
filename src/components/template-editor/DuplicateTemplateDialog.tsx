/**
 * Dialog pour dupliquer un template existant
 */

import { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
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
import { useTemplateSync } from '@/hooks/useTemplateSync';
import type { PDFTemplate, TemplatePageContent } from '@/types/template-editor';
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
  const [loadingPhase, setLoadingPhase] = useState<'idle' | 'loading' | 'duplicating'>('idle');

  const { duplicateTemplate, allVersions } = useTemplateEditorStore();
  const { loadVersionPages } = useTemplateSync();

  const handleDuplicate = async () => {
    if (!name.trim()) {
      toast.error('Le nom du template est requis');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Identifier les versions à dupliquer
      const sourceVersions = allVersions.filter(v => v.templateId === template.id);
      let versionsToDuplicate = sourceVersions;
      
      if (!includeAllVersions) {
        const publishedVersions = sourceVersions.filter(v => v.status === 'publie');
        const latestVersion = publishedVersions.length > 0
          ? publishedVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b)
          : sourceVersions.length > 0
            ? sourceVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b)
            : null;
        versionsToDuplicate = latestVersion ? [latestVersion] : [];
      }

      // 2. Charger les pages depuis le cloud si nécessaire (lazy loading)
      const preloadedPages: Record<string, TemplatePageContent[]> = {};
      
      for (const version of versionsToDuplicate) {
        if (!version.pages || version.pages.length === 0) {
          setLoadingPhase('loading');
          console.log(`Chargement des pages depuis le cloud pour version ${version.id}...`);
          const pages = await loadVersionPages(version.id);
          if (pages) {
            preloadedPages[version.id] = pages;
            console.log(`Pages chargées: ${pages.length} pages`);
          }
        }
      }

      // 3. Dupliquer avec les pages préchargées
      setLoadingPhase('duplicating');
      const newTemplate = duplicateTemplate(template.id, name.trim(), description, includeAllVersions, preloadedPages);
      
      if (newTemplate) {
        toast.success(`Template "${newTemplate.name}" créé avec succès`);
        onOpenChange(false);
      } else {
        toast.error('Erreur lors de la duplication');
      }
    } catch (error) {
      console.error('Erreur duplication:', error);
      toast.error('Erreur lors de la duplication');
    } finally {
      setIsLoading(false);
      setLoadingPhase('idle');
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleDuplicate} disabled={isLoading || !name.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loadingPhase === 'loading' ? 'Chargement...' : loadingPhase === 'duplicating' ? 'Duplication...' : 'Dupliquer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
