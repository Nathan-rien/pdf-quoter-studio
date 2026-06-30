/**
 * Vue listing des templates PDF
 * Permet de sélectionner, dupliquer ou créer des templates
 */

import { useState } from 'react';
import { Plus, Copy, Edit, Trash2, CheckCircle, FileText, Clock, Settings, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import { DuplicateTemplateDialog } from './DuplicateTemplateDialog';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { seedContratCadreTemplate } from '@/lib/seedContratCadreTemplate';
import type { PDFTemplate } from '@/types/template-editor';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TemplateListView() {
  const [duplicateTemplate, setDuplicateTemplate] = useState<PDFTemplate | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PDFTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { 
    allTemplates, 
    allVersions,
    selectTemplate, 
    deleteTemplate,
    setShouldOpenPublishDialog
  } = useTemplateEditorStore();

  const { deleteTemplateFromDatabase } = useTemplateSync();

  const handleEditTemplate = (template: PDFTemplate) => {
    selectTemplate(template.id);
  };

  const handleDuplicate = (template: PDFTemplate) => {
    setDuplicateTemplate(template);
  };

  const handleDelete = (template: PDFTemplate) => {
    if (template.isActive) {
      toast.error('Impossible de supprimer le template actif');
      return;
    }
    setTemplateToDelete(template);
  };

  const confirmDelete = async () => {
    if (templateToDelete) {
      setIsDeleting(true);
      
      // 1. Supprimer de la base de données d'abord
      const dbSuccess = await deleteTemplateFromDatabase(templateToDelete.id);
      
      if (dbSuccess) {
        // 2. Supprimer du store local
        const success = deleteTemplate(templateToDelete.id);
        if (success) {
          toast.success(`Template "${templateToDelete.name}" supprimé`);
        }
      } else {
        toast.error('Erreur lors de la suppression du template');
      }
      
      setIsDeleting(false);
      setTemplateToDelete(null);
    }
  };

  const getLatestVersionInfo = (template: PDFTemplate) => {
    const versions = allVersions.filter((v) => v.templateId === template.id);
    if (versions.length === 0) return null;

    const draftVersions = versions.filter((v) => v.status === 'brouillon');
    if (draftVersions.length > 0) {
      return draftVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b);
    }

    const publishedVersions = versions.filter((v) => v.status === 'publie');
    if (publishedVersions.length > 0) {
      return publishedVersions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b);
    }

    return versions.reduce((a, b) => a.versionNumber > b.versionNumber ? a : b);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Templates</h1>
          <p className="text-muted-foreground">
            Créez, modifiez et gérez vos templates de propositions commerciales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau template
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={async () => {
                try {
                  await seedContratCadreTemplate(true);
                  toast.success('Template "Contrat Cadre Services" réinitialisé avec succès.');
                } catch (e: any) {
                  toast.error('Erreur lors de la création du template', { description: e?.message });
                }
              }}>
                <FileText className="h-4 w-4 mr-2" />
                Initialiser Contrat Cadre Services
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTemplates.map((template) => {
          const latestVersion = getLatestVersionInfo(template);
          
          return (
            <Card 
              key={template.id} 
              variant={template.isActive ? 'selected' : 'interactive'}
              className="relative"
            >
              {template.isActive && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-success text-success-foreground">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {template.description || 'Aucune description'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(template.updatedAt)}</span>
                  </div>
                  {latestVersion && (
                    <Badge variant={latestVersion.status === 'publie' ? 'default' : 'secondary'}>
                      v{latestVersion.versionNumber} - {latestVersion.status === 'publie' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditTemplate(template)}
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Éditer
                </Button>
                {latestVersion && latestVersion.status === 'brouillon' && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      setShouldOpenPublishDialog(true);
                      handleEditTemplate(template);
                    }}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Publier
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={template.isActive}
                  onClick={() => handleDelete(template)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {/* Carte "Nouveau template" */}
        <Card 
          variant="ghost" 
          className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors"
          onClick={() => setShowCreateDialog(true)}
        >
          <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <Plus className="h-10 w-10 mb-3" />
            <span className="font-medium">Créer un template</span>
            <span className="text-sm">À partir de zéro</span>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {duplicateTemplate && (
        <DuplicateTemplateDialog
          template={duplicateTemplate}
          open={!!duplicateTemplate}
          onOpenChange={(open) => !open && setDuplicateTemplate(null)}
        />
      )}

      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <AlertDialog open={!!templateToDelete} onOpenChange={(open) => !isDeleting && !open && setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le template ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le template "{templateToDelete?.name}" et toutes ses versions seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
