/**
 * Layout principal de l'éditeur de template PDF
 * Mode administration strictement séparé du mode devis
 */

import { useEffect, useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { EditorSidebar } from "./EditorSidebar";
import { EditorCanvas } from "./EditorCanvas";
import { ElementProperties } from "./ElementProperties";
import { VersionHistory } from "./VersionHistory";
import { PublishValidation } from "./PublishValidation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  Upload, 
  RotateCcw, 
  AlertCircle,
  FileText,
  History,
  Palette,
  Pencil,
  Type,
  ImagePlus
} from "lucide-react";
import { toast } from "sonner";

export function TemplateEditorLayout() {
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  
  const {
    currentVersion,
    hasUnsavedChanges,
    editorMode,
    allVersions,
    addElementMode,
    createNewVersion,
    saveCurrentVersion,
    loadVersion,
    discardChanges,
    getPublishedVersions,
    setAddElementMode
  } = useTemplateEditorStore();

  // Charger automatiquement une version au montage si aucune n'est sélectionnée
  useEffect(() => {
    if (!currentVersion && allVersions.length > 0) {
      // Chercher d'abord un brouillon, sinon la dernière version publiée
      const draft = allVersions.find(v => v.status === 'brouillon');
      const published = allVersions.find(v => v.status === 'publie');
      loadVersion(draft || published || allVersions[0]);
    } else if (!currentVersion && allVersions.length === 0) {
      // Créer une première version si aucune n'existe
      createNewVersion();
    }
  }, []);

  const handleSave = () => {
    saveCurrentVersion();
    toast.success("Version sauvegardée");
  };

  const handleDiscard = () => {
    discardChanges();
    toast.info("Modifications annulées");
  };

  const handleCreateVersion = () => {
    const newVersion = createNewVersion();
    if (newVersion) {
      toast.success(`Version ${newVersion.versionNumber} créée (brouillon)`);
    }
  };

  const publishedVersions = getPublishedVersions();
  const isEditable = currentVersion?.status === 'brouillon';
  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary text-primary-foreground">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Éditeur de Template</h1>
            <p className="text-sm text-muted-foreground">
              Mode administration - Modification du template PDF
            </p>
          </div>
        </div>

        {currentVersion && (
          <div className="flex items-center gap-3">
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
          </div>
        )}
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
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowPublishDialog(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Publier
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
            <div className="grid grid-cols-12 gap-6">
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
            versions={allVersions}
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
    </div>
  );
}
