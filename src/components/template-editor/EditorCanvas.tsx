/**
 * Canvas de l'éditeur - Visualisation et édition de la page
 * Affiche les éléments réels du PDF avec sélection interactive et drag & drop
 */

import { useState, useRef, useCallback } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicZoneOverlay } from "./DynamicZoneOverlay";
import { PDF_TEMPLATE_CONTRACT } from "@/lib/pdf-template-contract";
import { getDynamicZonesForPage } from "@/lib/template-protection";
import { cn } from "@/lib/utils";
import { ALLOWED_FONTS } from "@/lib/template-styles";
import { FileText, Lock, Eye, Edit3, Type, Image as ImageIcon } from "lucide-react";
import type { PDFPageNumber } from "@/types/pdf-template";
import type { TextContent, ImageContent } from "@/types/template-editor";
import { toast } from "sonner";

// Configuration des zones dynamiques (positions simulées pour le rendu visuel)
const ZONE_POSITIONS: Record<string, { top: string; height: string }> = {
  'invest_table_page4': { top: '28%', height: '48%' },
  'invest_table_page5': { top: '20%', height: '55%' },
  'location_block_page5': { top: '8%', height: '10%' },
  'services_inclus': { top: '18%', height: '22%' },
  'lease_back': { top: '42%', height: '22%' },
  'nos_options': { top: '66%', height: '22%' },
};

// Facteur d'échelle pour convertir les positions absolues en pourcentages
const CANVAS_SCALE = {
  width: 500, // Largeur max du canvas
  height: 707, // Hauteur proportionnelle A4 (500 * 297/210)
};

export function EditorCanvas() {
  const { 
    selectedPageNumber, 
    currentVersion,
    editorMode,
    selectedElementId,
    selectedDynamicZoneId,
    addElementMode,
    selectElement,
    selectDynamicZone,
    addElement,
    setAddElementMode,
    updateElementPosition,
    updateDynamicZonePosition
  } = useTemplateEditorStore();

  // États pour le drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number; y?: number; centerX?: boolean; centerY?: boolean }>({});
  const canvasRef = useRef<HTMLDivElement>(null);

  // Seuil de snap pour les guides (en pixels canvas)
  const SNAP_THRESHOLD = 8;

  const pageConfig = PDF_TEMPLATE_CONTRACT.pages.find(
    p => p.pageNumber === selectedPageNumber
  );
  
  // Utiliser les zones dynamiques depuis la version courante (avec positions personnalisées)
  const pageContent = currentVersion?.pages.find(p => p.pageNumber === selectedPageNumber);
  const dynamicZones = pageContent?.dynamicZones || [];
  
  const isEditable = currentVersion?.status === 'brouillon' && editorMode === 'edit';
  const isAddMode = addElementMode !== 'none';

  // Convertir position absolue en position relative canvas
  const getElementStyle = (element: { position: { x: number; y: number }; size: { width: number; height: number }; type?: string }) => {
    const left = (element.position.x / CANVAS_SCALE.width) * 100;
    const top = (element.position.y / CANVAS_SCALE.height) * 100;
    const maxWidth = (element.size.width / CANVAS_SCALE.width) * 100;
    const minHeight = (element.size.height / CANVAS_SCALE.height) * 100;
    
    const isTextType = element.type === 'text';
    
    return {
      left: `${Math.min(left, 95)}%`,
      top: `${Math.min(top, 95)}%`,
      // Pour les textes: largeur auto avec max-width, pour les images: largeur fixe
      ...(isTextType 
        ? { 
            maxWidth: `${Math.min(Math.max(maxWidth, 5), 95)}%`,
            width: 'fit-content',
            height: 'auto'
          }
        : { 
            width: `${Math.min(Math.max(maxWidth, 3), 95)}%`,
            height: `${Math.max(minHeight, 2)}%` 
          }
      ),
    };
  };

  // Drag & Drop handlers
  const handleMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    if (!isEditable || isAddMode) return;
    
    const element = pageContent?.elements.find(el => el.id === elementId);
    if (!element || element.isDynamic) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    selectElement(elementId);
  }, [isEditable, isAddMode, pageContent, selectElement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    // Drag d'un élément normal
    if (isDragging && selectedElementId) {
      const element = pageContent?.elements.find(el => el.id === selectedElementId);
      if (!element) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      let x = ((e.clientX - canvasRect.left - dragOffset.x) / canvasRect.width) * CANVAS_SCALE.width;
      let y = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * CANVAS_SCALE.height;
      
      // Calculer les guides d'alignement
      const centerCanvasX = CANVAS_SCALE.width / 2;
      const centerCanvasY = CANVAS_SCALE.height / 2;
      const elementCenterX = x + element.size.width / 2;
      const elementCenterY = y + element.size.height / 2;
      
      const newGuides: { x?: number; y?: number; centerX?: boolean; centerY?: boolean } = {};
      
      // Snap au centre horizontal
      if (Math.abs(elementCenterX - centerCanvasX) < SNAP_THRESHOLD) {
        x = centerCanvasX - element.size.width / 2;
        newGuides.x = centerCanvasX;
        newGuides.centerX = true;
      }
      
      // Snap au centre vertical
      if (Math.abs(elementCenterY - centerCanvasY) < SNAP_THRESHOLD) {
        y = centerCanvasY - element.size.height / 2;
        newGuides.y = centerCanvasY;
        newGuides.centerY = true;
      }
      
      // Snap aux bords (marges de 20px)
      const margins = [20, 40, 60];
      for (const margin of margins) {
        // Bord gauche
        if (Math.abs(x - margin) < SNAP_THRESHOLD) {
          x = margin;
          newGuides.x = margin;
        }
        // Bord droit
        if (Math.abs(x + element.size.width - (CANVAS_SCALE.width - margin)) < SNAP_THRESHOLD) {
          x = CANVAS_SCALE.width - margin - element.size.width;
          newGuides.x = CANVAS_SCALE.width - margin;
        }
        // Bord haut
        if (Math.abs(y - margin) < SNAP_THRESHOLD) {
          y = margin;
          newGuides.y = margin;
        }
        // Bord bas
        if (Math.abs(y + element.size.height - (CANVAS_SCALE.height - margin)) < SNAP_THRESHOLD) {
          y = CANVAS_SCALE.height - margin - element.size.height;
          newGuides.y = CANVAS_SCALE.height - margin;
        }
      }
      
      setAlignmentGuides(newGuides);
      
      // Limites plus souples : permettre de déplacer jusqu'aux bords du canvas
      // avec une marge minimale de 10px
      const clampedX = Math.max(0, Math.min(x, CANVAS_SCALE.width - 10));
      const clampedY = Math.max(0, Math.min(y, CANVAS_SCALE.height - 10));
      
      updateElementPosition(selectedElementId, { 
        x: Math.round(clampedX), 
        y: Math.round(clampedY) 
      });
    }
    
    // Drag d'une zone dynamique
    if (isDraggingZone && selectedDynamicZoneId) {
      const zone = dynamicZones.find(z => z.id === selectedDynamicZoneId);
      if (!zone) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const yPercent = ((e.clientY - canvasRect.top - dragOffset.y) / canvasRect.height) * 100;
      
      const defaultPosition = ZONE_POSITIONS[zone.id] || { top: '30%', height: '40%' };
      const currentHeight = zone.position?.height || parseFloat(defaultPosition.height);
      
      // Clamper entre 5% et (100% - height)
      const clampedTop = Math.max(5, Math.min(yPercent, 95 - currentHeight));
      
      updateDynamicZonePosition(selectedDynamicZoneId, {
        top: Math.round(clampedTop),
        height: currentHeight
      });
    }
  }, [isDragging, isDraggingZone, selectedElementId, selectedDynamicZoneId, dragOffset, pageContent, dynamicZones, updateElementPosition, updateDynamicZonePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsDraggingZone(false);
    setAlignmentGuides({});
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging || isDraggingZone) {
      setIsDragging(false);
      setIsDraggingZone(false);
      setAlignmentGuides({});
    }
  }, [isDragging, isDraggingZone]);

  // Handler pour démarrer le drag d'une zone dynamique
  const handleZoneMouseDown = useCallback((zoneId: string, e: React.MouseEvent) => {
    if (!isEditable || isAddMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: 0,
      y: e.clientY - rect.top
    });
    setIsDraggingZone(true);
    selectDynamicZone(zoneId);
  }, [isEditable, isAddMode, selectDynamicZone]);

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging) return;
    
    selectElement(elementId);
    
    // Afficher un hint si en mode lecture seule
    if (!isEditable && currentVersion?.status !== 'brouillon') {
      toast.info("Version publiée en lecture seule. Cliquez sur 'Éditer' pour créer un brouillon.", {
        id: 'readonly-hint',
        duration: 3000
      });
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || isDraggingZone) return;
    
    // Mode ajout d'élément
    if (isAddMode && isEditable) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_SCALE.width;
      const y = ((e.clientY - rect.top) / rect.height) * CANVAS_SCALE.height;
      
      try {
        const newElement = addElement(addElementMode, { x: Math.round(x), y: Math.round(y) });
        toast.success(`${addElementMode === 'image' ? 'Image' : 'Texte'} ajouté(e)`);
      } catch (error) {
        toast.error("Erreur lors de l'ajout de l'élément");
      }
      return;
    }
    
    selectElement(null);
    selectDynamicZone(null);
  };

  const handleCancelAddMode = () => {
    setAddElementMode('none');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Page {selectedPageNumber}
          </CardTitle>
          {pageConfig && (
            <span className="text-xs text-muted-foreground">
              {pageConfig.title}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {dynamicZones.length > 0 && (
            <Badge variant="warning" className="gap-1">
              <Lock className="h-3 w-3" />
              {dynamicZones.length} zone{dynamicZones.length > 1 ? 's' : ''} protégée{dynamicZones.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant={isEditable ? 'success' : 'secondary'} className="gap-1">
            {isEditable ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {isEditable ? 'Édition' : 'Lecture seule'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Message mode ajout */}
        {isAddMode && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
            <p className="text-sm text-primary">
              Cliquez sur le canvas pour placer {addElementMode === 'image' ? 'l\'image' : 'le texte'}
            </p>
            <Button variant="ghost" size="sm" onClick={handleCancelAddMode}>
              Annuler
            </Button>
          </div>
        )}

        {/* Canvas A4 simulé */}
        <div 
          ref={canvasRef}
          className={cn(
            "relative mx-auto bg-white rounded-lg shadow-lg overflow-hidden",
            "border-2",
            isEditable ? "border-primary/30" : "border-border",
            isAddMode && "cursor-crosshair",
            (isDragging || isDraggingZone) && "cursor-grabbing"
          )}
          style={{
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '210 / 297', // A4 ratio
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Guides d'alignement */}
          {isDragging && alignmentGuides.x !== undefined && (
            <div 
              className="absolute top-0 bottom-0 w-px bg-primary z-50 pointer-events-none"
              style={{ 
                left: `${(alignmentGuides.x / CANVAS_SCALE.width) * 100}%`,
                boxShadow: '0 0 4px hsl(var(--primary))'
              }}
            >
              {alignmentGuides.centerX && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] px-1 rounded">
                  Centre
                </div>
              )}
            </div>
          )}
          {isDragging && alignmentGuides.y !== undefined && (
            <div 
              className="absolute left-0 right-0 h-px bg-primary z-50 pointer-events-none"
              style={{ 
                top: `${(alignmentGuides.y / CANVAS_SCALE.height) * 100}%`,
                boxShadow: '0 0 4px hsl(var(--primary))'
              }}
            >
              {alignmentGuides.centerY && (
                <div className="absolute left-1 top-1 bg-primary text-primary-foreground text-[8px] px-1 rounded">
                  Centre
                </div>
              )}
            </div>
          )}

          {/* Header simulé */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="w-20 h-6 bg-gray-100/50 rounded" />
            <div className="text-[10px] text-gray-300">Page {selectedPageNumber}/8</div>
          </div>

          {/* Zones dynamiques (affichées en premier pour être en fond) */}
          {dynamicZones.map((zone) => {
            const defaultPosition = ZONE_POSITIONS[zone.id] || { top: '30%', height: '40%' };
            const customPosition = zone.position;
            const topValue = customPosition ? `${customPosition.top}%` : defaultPosition.top;
            const heightValue = customPosition ? `${customPosition.height}%` : defaultPosition.height;
            const isZoneSelected = selectedDynamicZoneId === zone.id;
            const isZoneDragged = isDraggingZone && selectedDynamicZoneId === zone.id;
            
            return (
              <div
                key={zone.id}
                className={cn(
                  "absolute transition-all",
                  isEditable && "cursor-grab",
                  isZoneDragged && "cursor-grabbing opacity-90 shadow-xl z-30",
                  isZoneSelected && !isZoneDragged && "ring-2 ring-primary ring-offset-2 z-20"
                )}
                style={{
                  left: '4%',
                  right: '4%',
                  top: topValue,
                  height: heightValue,
                }}
                onMouseDown={(e) => handleZoneMouseDown(zone.id, e)}
              >
                <DynamicZoneOverlay 
                  zone={zone}
                  isSelected={isZoneSelected}
                  isEditable={isEditable}
                />
              </div>
            );
          })}

          {/* Éléments éditables du template */}
          {pageContent?.elements
            .filter(e => !e.isDynamic)
            .map((element) => {
              const style = getElementStyle({ ...element, type: element.type });
              const isSelected = selectedElementId === element.id;
              const isTextElement = element.type === 'text';
              const textContent = isTextElement ? element.content as TextContent : null;
              const imageContent = !isTextElement && element.type === 'image' ? element.content as ImageContent : null;
              
              const isDraggedElement = isDragging && selectedElementId === element.id;
              
              return (
                <div
                  key={element.id}
                  className={cn(
                    "absolute rounded-sm",
                    !isDragging && "transition-all duration-150",
                    isEditable && !element.isDynamic ? "cursor-grab" : "cursor-pointer",
                    isDraggedElement && "cursor-grabbing opacity-80 shadow-lg scale-[1.02]",
                    isSelected 
                      ? "ring-1 ring-primary bg-primary/5 z-20" 
                      : "hover:bg-primary/5 hover:ring-1 hover:ring-primary/50 z-10",
                  )}
                  style={style}
                  onMouseDown={(e) => handleMouseDown(element.id, e)}
                  onClick={(e) => handleElementClick(element.id, e)}
                  title={isEditable ? "Glisser pour déplacer" : "Mode lecture seule"}
                >
                  {isTextElement && textContent && (
                    <div 
                      className="px-0.5 py-px inline-block"
                      style={{
                        fontFamily: ALLOWED_FONTS.find(f => f.name === textContent.fontFamily)?.value || textContent.fontFamily,
                        fontSize: `${Math.max(textContent.fontSize * 0.4, 6)}px`,
                        color: textContent.color,
                        fontWeight: textContent.bold ? 'bold' : 'normal',
                        fontStyle: textContent.italic ? 'italic' : 'normal',
                        textDecoration: textContent.underline ? 'underline' : 'none',
                        lineHeight: 1.2,
                      }}
                    >
                      <span className="whitespace-pre-wrap break-words">{textContent.text}</span>
                    </div>
                  )}
                  
                  {element.type === 'image' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded">
                      {imageContent?.imageUrl ? (
                        <img 
                          src={imageContent.imageUrl} 
                          alt={imageContent.alt || 'Image'} 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-300">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-[8px]">Image</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Indicateur de sélection */}
                  {isSelected && (
                    <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                      {isTextElement ? (
                        <Type className="h-2.5 w-2.5" />
                      ) : (
                        <ImageIcon className="h-2.5 w-2.5" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Légende et stats */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-warning bg-warning/20" />
              <span>Zone dynamique (protégée)</span>
            </div>
            {isEditable && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded ring-2 ring-primary bg-primary/10" />
                <span>Élément sélectionné</span>
              </div>
            )}
          </div>
          
          {pageContent && (
            <div className="text-center text-xs text-muted-foreground">
              {pageContent.elements.filter(e => !e.isDynamic).length} élément(s) éditable(s) sur cette page
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
