/**
 * Dialog de validation avant publication du template
 * Vérifie l'intégrité des zones dynamiques
 */

import { useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
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
  Upload,
  AlertCircle
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
    validateDynamicZonesIntegrity,
    publishVersion 
  } = useTemplateEditorStore();

  const validationResult = currentVersion ? validateDynamicZonesIntegrity() : null;

  const handlePublish = async () => {
    if (!validationResult?.canPublish) return;

    setIsPublishing(true);
    
    // Simuler un délai de publication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = publishVersion();
    
    setIsPublishing(false);
    
    if (result.canPublish) {
      toast.success("Template publié avec succès", {
        description: `Version ${currentVersion?.versionNumber} maintenant disponible pour les devis.`
      });
      onOpenChange(false);
    } else {
      toast.error("Échec de la publication", {
        description: result.errors[0]?.message || "Une erreur est survenue."
      });
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
            <Upload className="h-5 w-5" />
            Publier la version {currentVersion.versionNumber}
          </DialogTitle>
          <DialogDescription>
            Vérification de l'intégrité du template avant publication.
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
            <p className="mb-2">Après publication :</p>
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
                Publication...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Publier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
