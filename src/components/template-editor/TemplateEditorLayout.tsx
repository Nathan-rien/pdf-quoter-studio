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
import { DynamicZoneManager } from "./DynamicZoneManager";
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
  Settings,
  Check,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { seedContratCadreTemplate } from "@/lib/seedContratCadreTemplate";
import { cn } from "@/lib/utils";

export function TemplateEditorLayout() {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  
  // Synchronisation avec le cloud
  const { isLoading, isSyncing, isLoadingVersion, syncAllToDatabase, saveTemplateToDatabase, loadVersionPages } = useTemplateSync();
  
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
    getTemplateVersions,
    renameTemplate
  } = useTemplateEditorStore();

  // Récupérer le template courant
  const currentTemplate = allTemplates.find(t => t.id === currentTemplateId);
  
  // Récupérer les versions du template courant
  const templateVersions = currentTemplateId ? getTemplateVersions(currentTemplateId) : [];

  // Auto-load pages from cloud if current version has empty pages
  // But skip for local-only versions (not yet synced to cloud)
  useEffect(() => {
    const loadPagesIfEmpty = async () => {
      if (
        currentVersion && 
        currentVersion.id && 
        (!currentVersion.pages || currentVersion.pages.length === 0) &&
        !isLoadingVersion
      ) {
        // Check if this is a local-only version (not synced to cloud yet)
        // Local IDs start with "version-" while cloud IDs are UUIDs
        const isLocalOnlyVersion = currentVersion.id.startsWith('version-');
        
        if (isLocalOnlyVersion) {
          // For local versions without pages, we should not try to load from cloud
          // The pages should have been populated during creation/duplication
          console.log('Version locale détectée avec pages vides - pas de chargement cloud');
          return;
        }
        
        console.log('Pages vides détectées, chargement depuis le cloud...');
        await loadVersionPages(currentVersion.id);
      }
    };
    
    loadPagesIfEmpty();
  }, [currentVersion?.id, currentVersion?.pages?.length, isLoadingVersion, loadVersionPages]);

  const handleDiscard = async () => {
    setIsDiscarding(true);
    if (currentVersion) {
      try {
        await loadVersionPages(currentVersion.id);
      } catch {
        // Ignore error, proceed with discard
      }
    }
    discardChanges();
    setIsDiscarding(false);
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

  const handleStartEditingName = () => {
    if (currentTemplate) {
      setEditedName(currentTemplate.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (currentTemplateId && editedName.trim()) {
      const newName = editedName.trim();
      setIsSavingName(true);
      
      // Mettre à jour localement d'abord
      renameTemplate(currentTemplateId, newName);
      
      // Récupérer le template mis à jour depuis le store
      const updatedTemplate = useTemplateEditorStore.getState().allTemplates.find(t => t.id === currentTemplateId);
      
      if (updatedTemplate) {
        // Sauvegarder immédiatement dans le cloud
        const success = await saveTemplateToDatabase(updatedTemplate);
        if (success) {
          toast.success("Template renommé et sauvegardé");
        } else {
          toast.error("Erreur lors de la sauvegarde du nom");
        }
      }
      
      setIsSavingName(false);
    }
    setIsEditingName(false);
  };

  const handleCancelEditingName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') handleCancelEditingName();
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
    <div className="space-y-2 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleBackToList} className="h-7 px-2">
            <ArrowLeft className="h-3 w-3 mr-1" />
            <span className="text-xs">Retour</span>
          </Button>
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  className="h-7 text-base font-bold px-2 w-64"
                />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveName} disabled={isSavingName}>
                  {isSavingName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEditingName}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <h1 
                className="text-base font-bold cursor-pointer hover:text-primary flex items-center gap-1 group"
                onClick={handleStartEditingName}
                title="Cliquer pour renommer"
              >
                {currentTemplate?.name || 'Éditeur de Template'}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </h1>
            )}
            <p className="text-[10px] text-muted-foreground">
              Mode administration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentVersion && (
            <>
              <Badge 
                variant={
                  currentVersion.status === 'publie' ? 'success' : 
                  currentVersion.status === 'archive' ? 'secondary' : 'pending'
                }
                className="text-[10px]"
              >
                {currentVersion.status === 'publie' ? 'Publié' : 
                 currentVersion.status === 'archive' ? 'Archivé' : 'Brouillon'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                v{currentVersion.versionNumber}
              </span>
            </>
          )}
          
          {/* Menu paramètres */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSyncToCloud} disabled={isSyncing}>
                <Cloud className="h-4 w-4 mr-2" />
                {isSyncing ? 'Synchronisation...' : 'Sync vers le cloud'}
              </DropdownMenuItem>
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
        <CardContent className="py-1.5 px-2 flex items-center gap-2">
          <AlertCircle className="h-3 w-3 text-warning shrink-0" />
          <p className="text-[10px]">
            <strong>Administration</strong> — Zones dynamiques protégées.
          </p>
        </CardContent>
      </Card>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'history')}>
        <div className="flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="editor" className="gap-1.5 text-xs h-7 px-2">
              <FileText className="h-3 w-3" />
              Éditeur
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 text-xs h-7 px-2">
              <History className="h-3 w-3" />
              Versions
            </TabsTrigger>
          </TabsList>

          {activeTab === 'editor' && currentVersion && (
            <div className="flex items-center gap-2">
              {/* Barre d'outils ajout d'éléments */}
              {isEditable && (
                <div className="flex items-center gap-0.5 border rounded-md p-0.5 bg-muted/30">
                  <Button
                    variant={addElementMode === 'text' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setAddElementMode(addElementMode === 'text' ? 'none' : 'text')}
                  >
                    <Type className="h-3 w-3 mr-1" />
                    Texte
                  </Button>
                  <Button
                    variant={addElementMode === 'image' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => setAddElementMode(addElementMode === 'image' ? 'none' : 'image')}
                  >
                    <ImagePlus className="h-3 w-3 mr-1" />
                    Image
                  </Button>
                </div>
              )}
              
              {currentVersion.status === 'brouillon' ? (
                <>
                  {hasUnsavedChanges && (
                    <Badge variant="warning" className="animate-pulse text-[10px]">
                      Non sauvegardé
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleDiscard}
                    disabled={!hasUnsavedChanges || isDiscarding}
                  >
                    <RotateCcw className={cn("h-3 w-3 mr-1", isDiscarding && "animate-spin")} />
                    {isDiscarding ? "Annulation..." : "Annuler"}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowPublishDialog(true)}
                    disabled={!hasUnsavedChanges}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Sauvegarder
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCreateVersion}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Éditer
                </Button>
              )}
            </div>
          )}
        </div>

        <TabsContent value="editor" className="mt-2">
          {currentVersion ? (
            <div className="grid grid-cols-12 gap-1.5" style={{ height: 'calc(100vh - 180px)' }}>
              {/* Sidebar gauche - Navigation pages */}
              <div className="col-span-2 overflow-auto">
                <EditorSidebar />
              </div>

              {/* Canvas central - plus large */}
              <div className="col-span-8 overflow-auto">
                <EditorCanvas />
              </div>

              {/* Panel droit - Propriétés - plus compact */}
              <div className="col-span-2 overflow-auto space-y-2">
                <ElementProperties />
                <DynamicZoneManager />
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aucune version sélectionnée</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Sélectionnez une version existante ou créez-en une nouvelle.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateVersion}>
                    Créer une nouvelle version
                  </Button>
                  {publishedVersions.length > 0 && (
                    <Button 
                      variant="outline"
                      size="sm"
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

        <TabsContent value="history" className="mt-2">
          <VersionHistory 
            versions={templateVersions}
            currentVersionId={currentVersion?.id || null}
            onSelectVersion={(version) => {
              loadVersion(version);
              setActiveTab('editor');
            }}
            onCreateVersion={handleCreateVersion}
            onLoadVersionPages={async (versionId) => {
              const pages = await loadVersionPages(versionId);
              if (pages !== null) {
                setActiveTab('editor');
              }
              return pages !== null;
            }}
            isLoadingVersion={isLoadingVersion}
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
