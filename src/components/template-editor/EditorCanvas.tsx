/**
 * Canvas de l'éditeur - Visualisation et édition de la page
 * Affiche les éléments réels du PDF avec sélection interactive
 */

import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicZoneOverlay } from "./DynamicZoneOverlay";
import { PDF_TEMPLATE_CONTRACT } from "@/lib/pdf-template-contract";
import { getDynamicZonesForPage } from "@/lib/template-protection";
import { cn } from "@/lib/utils";
import { FileText, Lock, Eye, Edit3, Type, Image as ImageIcon } from "lucide-react";
import type { PDFPageNumber } from "@/types/pdf-template";
import type { TextContent, ImageContent } from "@/types/template-editor";

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
  width: 400, // Largeur max du canvas
  height: 566, // Hauteur proportionnelle A4 (400 * 297/210)
};

export function EditorCanvas() {
  const { 
    selectedPageNumber, 
    currentVersion,
    editorMode,
    selectedElement,
    selectElement
  } = useTemplateEditorStore();

  const pageConfig = PDF_TEMPLATE_CONTRACT.pages.find(
    p => p.pageNumber === selectedPageNumber
  );
  
  const dynamicZones = getDynamicZonesForPage(selectedPageNumber as PDFPageNumber);
  const pageContent = currentVersion?.pages.find(p => p.pageNumber === selectedPageNumber);
  
  const isEditable = currentVersion?.status === 'brouillon' && editorMode === 'edit';

  // Convertir position absolue en position relative canvas
  const getElementStyle = (element: { position: { x: number; y: number }; size: { width: number; height: number } }) => {
    const left = (element.position.x / CANVAS_SCALE.width) * 100;
    const top = (element.position.y / CANVAS_SCALE.height) * 100;
    const width = (element.size.width / CANVAS_SCALE.width) * 100;
    const height = (element.size.height / CANVAS_SCALE.height) * 100;
    
    return {
      left: `${Math.min(left, 95)}%`,
      top: `${Math.min(top, 95)}%`,
      width: `${Math.min(width, 95)}%`,
      height: `${Math.max(height, 2)}%`,
    };
  };

  const handleElementClick = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Toujours permettre la sélection (l'édition est contrôlée dans ElementProperties)
    selectElement(elementId);
  };

  const handleCanvasClick = () => {
    selectElement(null);
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
        {/* Canvas A4 simulé */}
        <div 
          className={cn(
            "relative mx-auto bg-white rounded-lg shadow-lg overflow-hidden",
            "border-2",
            isEditable ? "border-primary/30" : "border-border"
          )}
          style={{
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '210 / 297', // A4 ratio
          }}
          onClick={handleCanvasClick}
        >
          {/* Header simulé */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="w-20 h-6 bg-gray-100/50 rounded" />
            <div className="text-[10px] text-gray-300">Page {selectedPageNumber}/8</div>
          </div>

          {/* Zones dynamiques (affichées en premier pour être en fond) */}
          {dynamicZones.map((zone) => {
            const position = ZONE_POSITIONS[zone.id] || { top: '30%', height: '40%' };
            return (
              <DynamicZoneOverlay 
                key={zone.id}
                zone={zone}
                style={{
                  position: 'absolute',
                  left: '4%',
                  right: '4%',
                  top: position.top,
                  height: position.height,
                }}
              />
            );
          })}

          {/* Éléments éditables du template */}
          {pageContent?.elements
            .filter(e => !e.isDynamic)
            .map((element) => {
              const style = getElementStyle(element);
              const isSelected = selectedElement?.id === element.id;
              const isTextElement = element.type === 'text';
              const textContent = isTextElement ? element.content as TextContent : null;
              const imageContent = !isTextElement && element.type === 'image' ? element.content as ImageContent : null;
              
              return (
                <div
                  key={element.id}
                  className={cn(
                    "absolute cursor-pointer transition-all duration-150 overflow-hidden",
                    "rounded-sm",
                    isSelected 
                      ? "ring-2 ring-primary ring-offset-1 bg-primary/5 z-20" 
                      : "hover:bg-primary/5 hover:ring-1 hover:ring-primary/50 z-10",
                  )}
                  style={style}
                  onClick={(e) => handleElementClick(element.id, e)}
                  title={isEditable ? "Cliquez pour modifier" : "Mode lecture seule"}
                >
                  {isTextElement && textContent && (
                    <div 
                      className="p-1 w-full h-full flex items-start"
                      style={{
                        fontFamily: textContent.fontFamily,
                        fontSize: `${Math.max(textContent.fontSize * 0.4, 6)}px`,
                        color: textContent.color,
                        fontWeight: textContent.bold ? 'bold' : 'normal',
                        fontStyle: textContent.italic ? 'italic' : 'normal',
                        textDecoration: textContent.underline ? 'underline' : 'none',
                        lineHeight: 1.3,
                      }}
                    >
                      <span className="line-clamp-4">{textContent.text}</span>
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
