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
import { Lock, FileText, Table, Settings, Square, Circle, Minus, RectangleHorizontal, Sparkles, MoveVertical } from "lucide-react";
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
  { type: 'line', label: 'Ligne H', icon: Minus },
  { type: 'line-vertical', label: 'Ligne V', icon: MoveVertical },
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
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-1 px-2 py-2">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <FileText className="h-3 w-3" />
          Pages ({pages.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-1.5 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-0.5">
            {pages.map((page) => {
              const isSelected = selectedPageNumber === page.pageNumber;
              const hasDynamicZones = page.dynamicZones.length > 0;
              const Icon = PAGE_ICONS[page.pageNumber] || FileText;
              
              return (
                <Button
                  key={page.pageNumber}
                  variant={isSelected ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-auto py-1.5 px-2",
                    isSelected && "ring-1 ring-primary ring-offset-1"
                  )}
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
                        {page.title}
                      </span>
                    </div>
                    
                    {hasDynamicZones && (
                      <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>

        {isEditable && (
          <>
            <Separator className="my-2" />
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground px-1">Formes</p>
              <div className="grid grid-cols-3 gap-0.5">
                {SHAPE_OPTIONS.map(({ type, label, icon: ShapeIcon }) => (
                  <Button
                    key={type}
                    variant={addElementMode === 'shape' && selectedShapeType === type ? "default" : "outline"}
                    size="sm"
                    className="h-9 flex-col gap-0 text-[8px] px-1"
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
