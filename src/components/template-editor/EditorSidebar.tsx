/**
 * Sidebar de l'éditeur - Navigation entre les pages et ajout de logos/formes/icônes
 */

import { useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { isProtectedPage } from "@/types/pdf-template";
import { TEMPLATE_LOGOS, LOGO_POSITIONS, DEFAULT_FOOTER_LOGO_SIZE } from "@/lib/template-logos";
import { 
  Lock, 
  FileText, 
  Table, 
  Settings, 
  Square, 
  Circle, 
  Minus, 
  RectangleHorizontal, 
  Sparkles, 
  MoveVertical, 
  ImageIcon,
  Plus,
  Trash2
} from "lucide-react";
import type { PDFPageNumber } from "@/types/pdf-template";
import type { ShapeType } from "@/types/template-editor";
import { IconLibraryDialog } from "./IconLibraryDialog";
import { CreatePageDialog } from "./CreatePageDialog";
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

const PAGE_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  4: Table,
  5: Table,
  6: Settings,
};

const SHAPE_OPTIONS: { type: ShapeType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'rectangle', label: 'Rectangle', icon: RectangleHorizontal },
  { type: 'square', label: 'Carré', icon: Square },
  { type: 'rounded-rectangle', label: 'Arrondi', icon: RectangleHorizontal },
  { type: 'circle', label: 'Cercle', icon: Circle },
  { type: 'ellipse', label: 'Ellipse', icon: Circle },
  { type: 'line', label: 'Ligne H', icon: Minus },
  { type: 'line-vertical', label: 'Ligne V', icon: MoveVertical },
];

export function EditorSidebar() {
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<number | null>(null);
  const [createPageDialogOpen, setCreatePageDialogOpen] = useState(false);
  
  const { 
    selectedPageNumber, 
    setSelectedPage,
    currentVersion,
    currentTemplateId,
    allTemplates,
    editorMode,
    addElementMode,
    selectedShapeType,
    selectedLogoId,
    setAddElementMode,
    setSelectedShapeType,
    setSelectedIconName,
    setSelectedLogoId,
    addPage,
    deletePage,
    canDeletePage,
    addLogoToAllPages,
    setPageDocumentScope,
  } = useTemplateEditorStore();

  const pages = currentVersion?.pages || [];
  const isEditable = editorMode === 'edit' && currentVersion?.status === 'brouillon';
  const currentTemplate = allTemplates.find((t) => t.id === currentTemplateId);
  const isContratCadreServices = currentTemplate?.name === 'Contrat Cadre Services';

  const handleShapeClick = (shapeType: ShapeType) => {
    if (!isEditable) return;
    setAddElementMode('shape');
    setSelectedShapeType(shapeType);
  };

  const handleIconSelect = (iconName: string) => {
    if (!isEditable) return;
    setAddElementMode('icon');
    setSelectedIconName(iconName);
  };

  const handleLogoClick = (logoId: string) => {
    if (!isEditable) return;
    setAddElementMode('logo');
    setSelectedLogoId(logoId);
  };

  const handleAddLogoToAllPages = (logoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditable) return;
    
    const count = addLogoToAllPages(
      logoId, 
      LOGO_POSITIONS.bottomRight, 
      DEFAULT_FOOTER_LOGO_SIZE
    );
    
    if (count > 0) {
      toast.success(`Logo ajouté sur ${count} pages`);
    }
  };

  const handleAddPage = () => {
    if (!isEditable) return;
    setCreatePageDialogOpen(true);
  };

  const handleConfirmAddPage = (title: string, afterPageNumber: number | null) => {
    const newPage = addPage(title, afterPageNumber ?? undefined);
    if (newPage) {
      toast.success(`Page ${newPage.pageNumber} ajoutée`);
      setSelectedPage(newPage.pageNumber as PDFPageNumber);
    }
    setCreatePageDialogOpen(false);
  };

  const handleDeletePageClick = (pageNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditable) return;
    
    const check = canDeletePage(pageNumber);
    if (!check.canDelete) {
      toast.error(check.reason || 'Impossible de supprimer cette page');
      return;
    }
    
    setPageToDelete(pageNumber);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePage = () => {
    if (pageToDelete !== null) {
      const check = canDeletePage(pageToDelete);
      const dynamicZonesCount = check.dynamicZonesCount || 0;
      
      // forceDelete = true pour bypasser l'avertissement
      const success = deletePage(pageToDelete, true);
      if (success) {
        if (dynamicZonesCount > 0) {
          toast.success(`Page ${pageToDelete} supprimée`, {
            description: `${dynamicZonesCount} zone(s) dynamique(s) ont été supprimées.`
          });
        } else {
          toast.success(`Page ${pageToDelete} supprimée`);
        }
      }
    }
    setDeleteDialogOpen(false);
    setPageToDelete(null);
  };

  const getDeleteWarning = () => {
    if (pageToDelete === null) return null;
    const check = canDeletePage(pageToDelete);
    return check.hasWarning ? check.warning : null;
  };

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="pb-1 px-2 py-2 shrink-0">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Pages ({pages.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-1.5 flex-1 flex flex-col overflow-hidden">
          {/* Liste des pages - scrollable */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-0.5">
              {pages.map((page) => {
                const isSelected = selectedPageNumber === page.pageNumber;
                const hasDynamicZones = page.dynamicZones.length > 0;
                const isProtected = isProtectedPage(page.pageNumber);
                const Icon = PAGE_ICONS[page.pageNumber] || FileText;
                const deleteCheck = canDeletePage(page.pageNumber);
                
                // Trouver le titre de la page (titre stocké ou fallback)
                const pageTitle = (page as any).title || `Page ${page.pageNumber}`;
                
                return (
                  <div
                    key={page.pageNumber}
                    className={cn(
                      "flex items-center gap-1 group",
                      isSelected && "ring-1 ring-primary ring-offset-1 rounded"
                    )}
                  >
                    <Button
                      variant={isSelected ? "secondary" : "ghost"}
                      className="flex-1 justify-start h-auto py-1.5 px-2"
                      onClick={() => setSelectedPage(page.pageNumber as PDFPageNumber)}
                    >
                      <div className="flex items-center gap-1.5 w-full">
                        <div className={cn(
                          "flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0",
                          hasDynamicZones 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {page.pageNumber}
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <span className="text-[10px] font-medium truncate block">
                            {pageTitle}
                          </span>
                        </div>
                        
                        {isProtected && (
                          <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    </Button>
                    
                    {/* Bouton de suppression (visible uniquement en mode édition pour les pages non protégées) */}
                    {isEditable && deleteCheck.canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => handleDeletePageClick(page.pageNumber, e)}
                        title="Supprimer cette page"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                );
              })}
              
              {/* Bouton d'ajout de page */}
              {isEditable && (
                <Button
                  variant="outline"
                  className="w-full justify-center h-8 mt-2 gap-1.5 text-[10px] border-dashed"
                  onClick={handleAddPage}
                >
                  <Plus className="h-3 w-3" />
                  Ajouter une page
                </Button>
              )}
            </div>
          </ScrollArea>

          {/* Section Logos, Formes et Icônes - toujours visible en mode édition */}
          {isEditable && (
            <div className="shrink-0 pt-2 border-t mt-2">
              {/* Section Logos */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground px-1 flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Logos
                </p>
                <div className="space-y-1">
                  {TEMPLATE_LOGOS.map((logo) => (
                    <div key={logo.id} className="flex items-center gap-1">
                      <Button
                        variant={addElementMode === 'logo' && selectedLogoId === logo.id ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-10 flex-1 p-1 flex items-center justify-center",
                          logo.previewBg === 'dark' ? "bg-gray-800 hover:bg-gray-700" : "bg-white hover:bg-gray-50"
                        )}
                        onClick={() => handleLogoClick(logo.id)}
                        title={`${logo.description} - Cliquez pour placer sur la page courante`}
                      >
                        <img 
                          src={logo.url} 
                          alt={logo.name} 
                          className="h-full w-full object-contain"
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-2 text-[8px] shrink-0"
                        onClick={(e) => handleAddLogoToAllPages(logo.id, e)}
                        title="Ajouter en bas à droite de toutes les pages"
                      >
                        <Plus className="h-3 w-3 mr-0.5" />
                        Toutes
                      </Button>
                    </div>
                  ))}
                </div>
                {addElementMode === 'logo' && selectedLogoId && (
                  <p className="text-[8px] text-center text-muted-foreground">
                    Cliquez sur le canvas
                  </p>
                )}
              </div>

              <Separator className="my-2" />

              {/* Section Formes */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground px-1">Formes</p>
                <div className="grid grid-cols-4 gap-0.5">
                  {SHAPE_OPTIONS.map(({ type, label, icon: ShapeIcon }) => (
                    <Button
                      key={type}
                      variant={addElementMode === 'shape' && selectedShapeType === type ? "default" : "outline"}
                      size="sm"
                      className="h-8 flex-col gap-0 text-[7px] px-0.5"
                      onClick={() => handleShapeClick(type)}
                    >
                      <ShapeIcon className={cn("h-3 w-3", type === 'rounded-rectangle' && "rounded")} />
                      {label}
                    </Button>
                  ))}
                </div>
                {addElementMode === 'shape' && selectedShapeType && (
                  <p className="text-[8px] text-center text-muted-foreground">
                    Cliquez sur le canvas
                  </p>
                )}
              </div>

              <Separator className="my-2" />

              {/* Section Icônes */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground px-1">Icônes</p>
                <Button
                  variant={addElementMode === 'icon' ? "default" : "outline"}
                  size="sm"
                  className="w-full gap-1.5 h-8 text-[10px]"
                  onClick={() => setIconDialogOpen(true)}
                >
                  <Sparkles className="h-3 w-3" />
                  Bibliothèque
                </Button>
                {addElementMode === 'icon' && (
                  <p className="text-[8px] text-center text-muted-foreground">
                    Cliquez sur le canvas
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dialog de sélection d'icônes */}
          <IconLibraryDialog
            open={iconDialogOpen}
            onOpenChange={setIconDialogOpen}
            onSelect={handleIconSelect}
          />

          {/* Dialog de création de page */}
          <CreatePageDialog
            open={createPageDialogOpen}
            onOpenChange={setCreatePageDialogOpen}
            onConfirm={handleConfirmAddPage}
            defaultAfterPage={selectedPageNumber}
          />
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
        <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la page {pageToDelete} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteWarning() ? (
                <span className="text-warning">{getDeleteWarning()}</span>
              ) : (
                'Cette action est irréversible. Tous les éléments de cette page seront supprimés.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePage} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
