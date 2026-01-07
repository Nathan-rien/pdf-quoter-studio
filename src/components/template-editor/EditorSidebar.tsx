/**
 * Sidebar de l'éditeur - Navigation entre les pages et ajout de formes/icônes
 */

import { useState } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PDF_TEMPLATE_CONTRACT } from "@/lib/pdf-template-contract";
import { Lock, FileText, Table, Settings, Square, Circle, Minus, RectangleHorizontal, Sparkles } from "lucide-react";
import type { PDFPageNumber } from "@/types/pdf-template";
import type { ShapeType } from "@/types/template-editor";
import { IconLibraryDialog } from "./IconLibraryDialog";

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
  { type: 'line', label: 'Ligne', icon: Minus },
];

export function EditorSidebar() {
  const [iconDialogOpen, setIconDialogOpen] = useState(false);
  
  const { 
    selectedPageNumber, 
    setSelectedPage,
    currentVersion,
    editorMode,
    addElementMode,
    selectedShapeType,
    setAddElementMode,
    setSelectedShapeType,
    setSelectedIconName
  } = useTemplateEditorStore();

  const pages = PDF_TEMPLATE_CONTRACT.pages;
  const isEditable = editorMode === 'edit' && currentVersion?.status === 'brouillon';

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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Pages ({pages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1">
            {pages.map((page) => {
              const isSelected = selectedPageNumber === page.pageNumber;
              const hasDynamicZones = page.dynamicZones.length > 0;
              const Icon = PAGE_ICONS[page.pageNumber] || FileText;
              
              return (
                <Button
                  key={page.pageNumber}
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto py-3 px-3",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setSelectedPage(page.pageNumber as PDFPageNumber)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded text-xs font-bold shrink-0",
                      hasDynamicZones 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {page.pageNumber}
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="text-xs font-medium">
                          {page.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1">
                        {page.type === 'static' && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            Statique
                          </Badge>
                        )}
                        {hasDynamicZones && (
                          <Badge variant="outline" className="text-[10px] h-4 gap-1">
                            <Lock className="h-2 w-2" />
                            {page.dynamicZones.length} zone{page.dynamicZones.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {isEditable && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-1">Ajouter une forme</p>
              <div className="grid grid-cols-3 gap-1">
                {SHAPE_OPTIONS.map(({ type, label, icon: ShapeIcon }) => (
                  <Button
                    key={type}
                    variant={addElementMode === 'shape' && selectedShapeType === type ? "default" : "outline"}
                    size="sm"
                    className="h-14 flex-col gap-1 text-[10px]"
                    onClick={() => handleShapeClick(type)}
                  >
                    <ShapeIcon className={cn("h-4 w-4", type === 'rounded-rectangle' && "rounded")} />
                  {label}
                  </Button>
                ))}
              </div>
              {addElementMode === 'shape' && selectedShapeType && (
                <p className="text-[10px] text-center text-muted-foreground">
                  Cliquez sur le canvas pour placer la forme
                </p>
              )}
            </div>

            <Separator className="my-4" />

            {/* Section Icônes */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground px-1">Ajouter une icône</p>
              <Button
                variant={addElementMode === 'icon' ? "default" : "outline"}
                size="sm"
                className="w-full gap-2"
                onClick={() => setIconDialogOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Bibliothèque d'icônes
              </Button>
              {addElementMode === 'icon' && (
                <p className="text-[10px] text-center text-muted-foreground">
                  Cliquez sur le canvas pour placer l'icône
                </p>
              )}
            </div>
          </>
        )}

        {/* Dialog de sélection d'icônes */}
        <IconLibraryDialog
          open={iconDialogOpen}
          onOpenChange={setIconDialogOpen}
          onSelect={handleIconSelect}
        />
      </CardContent>
    </Card>
  );
}
