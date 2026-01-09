/**
 * Dialog de validation avant publication du template
 * Vérifie l'intégrité des zones dynamiques et synchronise avec le cloud
 */

import { useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Save,
  AlertCircle,
  Cloud
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PublishValidationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublishValidation({ open, onOpenChange }: PublishValidationProps) {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { 
    currentVersion,
    currentTemplateId,
    allTemplates,
    validateDynamicZonesIntegrity,
    publishVersion 
  } = useTemplateEditorStore();

  const validationResult = currentVersion ? validateDynamicZonesIntegrity() : null;
  const currentTemplate = allTemplates.find(t => t.id === currentTemplateId);

  const handlePublish = async () => {
    if (!validationResult?.canPublish || !currentVersion || !currentTemplate) return;

    setIsPublishing(true);
    
    try {
      // 1. Publier localement
      const result = publishVersion();
      
      if (!result.canPublish) {
        toast.error("Échec de la sauvegarde", {
          description: result.errors[0]?.message || "Une erreur est survenue."
        });
        return;
      }

      // 2. Sauvegarder le template dans le cloud
      const { error: templateError } = await supabase
        .from('pdf_templates')
        .upsert({
          id: currentTemplate.id,
          name: currentTemplate.name,
          description: currentTemplate.description || null,
          is_active: currentTemplate.isActive
        }, { onConflict: 'id' });

      if (templateError) {
        console.error('Erreur sauvegarde template:', templateError);
        toast.error("Erreur de synchronisation cloud", {
          description: "Le template a été sauvegardé localement mais pas dans le cloud."
        });
        onOpenChange(false);
        return;
      }

      // 3. Sauvegarder la version dans le cloud
      const publishedVersion = useTemplateEditorStore.getState().currentVersion;
      if (publishedVersion) {
        const { error: versionError } = await supabase
          .from('template_versions')
          .upsert({
            id: publishedVersion.id,
            template_id: publishedVersion.templateId,
            version_number: publishedVersion.versionNumber,
            status: publishedVersion.status,
            pages: publishedVersion.pages as any,
            created_by: publishedVersion.createdBy || null,
            published_at: publishedVersion.publishedAt?.toISOString() || null
          });

        if (versionError) {
          console.error('Erreur sauvegarde version:', versionError);
          toast.error("Erreur de synchronisation cloud", {
            description: "La version a été sauvegardée localement mais pas dans le cloud."
          });
          onOpenChange(false);
          return;
        }
      }

      toast.success("Template sauvegardé et synchronisé", {
        description: `Version ${currentVersion?.versionNumber} disponible sur tous les appareils.`
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur publication:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!currentVersion) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Sauvegarder la version {currentVersion.versionNumber}
          </DialogTitle>
          <DialogDescription>
            Vérification de l'intégrité du template avant sauvegarde.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Statut global */}
          <div className={cn(
            "p-4 rounded-lg border-2 flex items-center gap-3",
            validationResult?.canPublish 
              ? "bg-success/10 border-success/30" 
              : "bg-destructive/10 border-destructive/30"
          )}>
            {validationResult?.canPublish ? (
              <>
                <CheckCircle className="h-6 w-6 text-success" />
                <div>
                  <p className="font-medium text-success">Prêt à publier</p>
                  <p className="text-sm text-muted-foreground">
                    Toutes les vérifications sont passées.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Publication bloquée</p>
                  <p className="text-sm text-muted-foreground">
                    Des erreurs doivent être corrigées.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Erreurs */}
          {validationResult && validationResult.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <XCircle className="h-4 w-4" />
                Erreurs ({validationResult.errors.length})
              </div>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {validationResult.errors.map((error, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          {error.pageNumber && (
                            <Badge variant="outline" className="mb-1 text-xs">
                              Page {error.pageNumber}
                            </Badge>
                          )}
                          <p className="text-destructive">{error.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Warnings */}
          {validationResult && validationResult.warnings.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  Avertissements ({validationResult.warnings.length})
                </div>
                <ScrollArea className="h-[100px]">
                  <div className="space-y-2">
                    {validationResult.warnings.map((warning, index) => (
                      <div 
                        key={index}
                        className="p-2 rounded-lg bg-warning/5 border border-warning/20 text-sm"
                      >
                        <p className="text-warning-foreground">{warning.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          <Separator />

          {/* Informations de publication */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Après sauvegarde :</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Cette version sera figée et ne pourra plus être modifiée</li>
              <li>Elle sera disponible pour la création de nouveaux devis</li>
              <li>Les devis existants ne seront pas affectés</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handlePublish}
            disabled={!validationResult?.canPublish || isPublishing}
            className="gap-2"
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
