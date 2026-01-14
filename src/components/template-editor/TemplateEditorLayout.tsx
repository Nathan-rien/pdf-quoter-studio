/**
 * Layout principal de l'éditeur de template PDF
 * Mode administration strictement séparé du mode devis
 */

import { useEffect, useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { useTemplateSync } from "@/hooks/useTemplateSync";
import { EditorSidebar } from "./EditorSidebar";
import { EditorCanvas } from "./EditorCanvas";
import { ElementProperties } from "./ElementProperties";
import { VersionHistory } from "./VersionHistory";
import { PublishValidation } from "./PublishValidation";
import { TemplateListView } from "./TemplateListView";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Save,
  RotateCcw, 
  AlertCircle,
  FileText,
  History,
  Palette,
  Pencil,
  Type,
  ImagePlus,
  ArrowLeft,
  Cloud,
  Loader2,
  Trash2,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";

export function TemplateEditorLayout() {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  
  // Synchronisation avec le cloud
  const { isLoading, isSyncing, syncAllToDatabase } = useTemplateSync();
  
  const {
    currentVersion,
    hasUnsavedChanges,
    editorMode,
    allVersions,
    allTemplates,
    currentTemplateId,
    viewMode,
    addElementMode,
    createNewVersion,
    loadVersion,
    discardChanges,
    getPublishedVersions,
    setAddElementMode,
    backToList,
    getTemplateVersions
  } = useTemplateEditorStore();

  // Récupérer le template courant
  const currentTemplate = allTemplates.find(t => t.id === currentTemplateId);
  
  // Récupérer les versions du template courant
  const templateVersions = currentTemplateId ? getTemplateVersions(currentTemplateId) : [];

  const handleDiscard = () => {
    discardChanges();
    toast.info("Modifications annulées");
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('template-editor-storage');
      toast.success("Cache local effacé", {
        description: "La page va se recharger pour appliquer les changements."
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erreur effacement cache:', error);
      toast.error("Erreur lors de l'effacement du cache");
    }
    setShowClearCacheDialog(false);
  };

  const handleSyncToCloud = async () => {
    const success = await syncAllToDatabase();
    if (success) {
      toast.success("Templates synchronisés vers le cloud");
    }
  };

  const handleCreateVersion = () => {
    const newVersion = createNewVersion();
    if (newVersion) {
      toast.success(`Version ${newVersion.versionNumber} créée (brouillon)`);
    }
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm("Des modifications non sauvegardées seront perdues. Continuer ?");
      if (!confirm) return;
    }
    backToList();
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Chargement des templates depuis le cloud...</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Afficher le listing si mode liste
  if (viewMode === 'list') {
    return <TemplateListView />;
  }

  const publishedVersions = getPublishedVersions();
  const isEditable = currentVersion?.status === 'brouillon';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="p-3 rounded-xl bg-primary text-primary-foreground">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {currentTemplate?.name || 'Éditeur de Template'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Mode administration - Modification du template PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentVersion && (
            <>
              <Badge 
                variant={
                  currentVersion.status === 'publie' ? 'success' : 
                  currentVersion.status === 'archive' ? 'secondary' : 'pending'
                }
              >
                {currentVersion.status === 'publie' ? 'Publié' : 
                 currentVersion.status === 'archive' ? 'Archivé' : 'Brouillon'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                v{currentVersion.versionNumber}
              </span>
            </>
          )}
          
          {/* Menu paramètres */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSyncToCloud} disabled={isSyncing}>
                <Cloud className="h-4 w-4 mr-2" />
                {isSyncing ? 'Synchronisation...' : 'Sync vers le cloud'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowClearCacheDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Effacer le cache local
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Warning banner */}
      <Card variant="warning" className="border-warning/50 bg-warning/10">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-sm">
            <strong>Mode Administration</strong> — Les zones dynamiques (tableaux Invest, options services) 
            sont protégées et ne peuvent pas être modifiées. Seuls les textes et images statiques sont éditables.
          </p>
        </CardContent>
      </Card>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'history')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="editor" className="gap-2">
              <FileText className="h-4 w-4" />
              Éditeur
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historique des versions
            </TabsTrigger>
          </TabsList>

          {activeTab === 'editor' && currentVersion && (
            <div className="flex items-center gap-4">
              {/* Barre d'outils ajout d'éléments */}
              {isEditable && (
                <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/30">
                  <Button
                    variant={addElementMode === 'text' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAddElementMode(addElementMode === 'text' ? 'none' : 'text')}
                  >
                    <Type className="h-4 w-4 mr-1" />
                    Texte
                  </Button>
                  <Button
                    variant={addElementMode === 'image' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setAddElementMode(addElementMode === 'image' ? 'none' : 'image')}
                  >
                    <ImagePlus className="h-4 w-4 mr-1" />
                    Image
                  </Button>
                </div>
              )}
              
              {currentVersion.status === 'brouillon' ? (
                <>
                  {hasUnsavedChanges && (
                    <Badge variant="warning" className="animate-pulse">
                      Modifications non sauvegardées
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDiscard}
                    disabled={!hasUnsavedChanges}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowPublishDialog(true)}
                    disabled={!hasUnsavedChanges}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCreateVersion}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Éditer (créer un brouillon)
                </Button>
              )}
            </div>
          )}
        </div>

        <TabsContent value="editor" className="mt-6">
          {currentVersion ? (
            <div className="grid grid-cols-12 gap-3">
              {/* Sidebar gauche - Navigation pages */}
              <div className="col-span-2">
                <EditorSidebar />
              </div>

              {/* Canvas central */}
              <div className="col-span-7">
                <EditorCanvas />
              </div>

              {/* Panel droit - Propriétés */}
              <div className="col-span-3">
                <ElementProperties />
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Aucune version sélectionnée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Sélectionnez une version existante dans l'historique ou créez une nouvelle version.
                </p>
                <div className="flex gap-3">
                  <Button onClick={handleCreateVersion}>
                    Créer une nouvelle version
                  </Button>
                  {publishedVersions.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => loadVersion(publishedVersions[0])}
                    >
                      Voir la version publiée
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <VersionHistory 
            versions={templateVersions}
            currentVersionId={currentVersion?.id || null}
            onSelectVersion={loadVersion}
            onCreateVersion={handleCreateVersion}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de publication */}
      <PublishValidation 
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
      />

      {/* Dialog confirmation effacement cache */}
      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Effacer le cache local ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer toutes les données stockées localement dans votre navigateur. 
              Les templates sauvegardés dans le cloud ne seront pas affectés et seront rechargés automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCache} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Effacer le cache
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
