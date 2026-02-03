import React, { useEffect, useRef } from 'react';
import { Check, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRentalProposalStore } from '@/stores/rentalProposalStore';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { useTemplateSync } from '@/hooks/useTemplateSync';
import { cn } from '@/lib/utils';
import type { TemplateVersion } from '@/types/template-editor';

// UUID regex for cloud IDs
const isUuid = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function TemplateSelector() {
  const { selectedTemplateId, selectTemplateForProposal } = useRentalProposalStore();
  const { allTemplates, getTemplateLatestVersion } = useTemplateEditorStore();
  const { isLoading, hasLoaded, loadVersionPages } = useTemplateSync();
  
  // Track requested version IDs to prevent duplicate requests
  const requestedRef = useRef(new Set<string>());

  // Filtrer uniquement les templates actifs ou publiés
  const availableTemplates = allTemplates.filter(template => {
    const version = getTemplateLatestVersion(template.id);
    return version && version.status === 'publie';
  });

  // Lazy load pages for published versions that don't have pages loaded yet
  useEffect(() => {
    if (!hasLoaded) return;

    const versionsToPreload = availableTemplates
      .map(t => getTemplateLatestVersion(t.id))
      .filter((v): v is TemplateVersion => !!v && v.status === 'publie')
      .filter(v => !v.pages || v.pages.length === 0)
      .filter(v => isUuid(v.id))
      .filter(v => !requestedRef.current.has(v.id));

    let cancelled = false;

    (async () => {
      for (const v of versionsToPreload) {
        if (cancelled) break;
        requestedRef.current.add(v.id);
        await loadVersionPages(v.id);
      }
    })();

    return () => { cancelled = true; };
  }, [hasLoaded, availableTemplates, getTemplateLatestVersion, loadVersionPages]);

  if (isLoading && !hasLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sélection du template</CardTitle>
          <CardDescription>Chargement des templates...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (availableTemplates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sélection du template</CardTitle>
          <CardDescription>Aucun template publié disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous devez d'abord créer et publier un template dans l'éditeur de templates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sélection du template</CardTitle>
        <CardDescription>
          Cliquez sur un template pour le sélectionner pour cette proposition.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTemplates.map((template) => {
            const version = getTemplateLatestVersion(template.id);
            const isSelected = selectedTemplateId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => selectTemplateForProposal(template.id)}
                className={cn(
                  'relative rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-muted hover:border-primary/50'
                )}
              >
                {/* Badge de sélection */}
                {isSelected && (
                  <Badge 
                    className="absolute -top-2 -right-2 bg-primary text-primary-foreground"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Sélectionné
                  </Badge>
                )}

                {/* Contenu de la carte */}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'rounded-lg p-2',
                    isSelected ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <FileText className={cn(
                      'h-6 w-6',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {template.description}
                      </p>
                    )}
                    
                    {/* Nombre de pages */}
                    {version && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {version.pages && version.pages.length > 0 
                            ? `${version.pages.length} pages` 
                            : 'Chargement...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message d'aide */}
        {!selectedTemplateId && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Sélectionnez un template pour continuer vers l'aperçu.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
