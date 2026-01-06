/**
 * Canvas de l'éditeur - Visualisation et édition de la page
 */

import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicZoneOverlay } from "./DynamicZoneOverlay";
import { PDF_TEMPLATE_CONTRACT } from "@/lib/pdf-template-contract";
import { getDynamicZonesForPage } from "@/lib/template-protection";
import { cn } from "@/lib/utils";
import { FileText, Lock, Eye, Edit3 } from "lucide-react";
import type { PDFPageNumber } from "@/types/pdf-template";

// Configuration des zones dynamiques (positions simulées pour le rendu visuel)
const ZONE_POSITIONS: Record<string, { top: string; height: string }> = {
  'invest_table_page4': { top: '25%', height: '60%' },
  'invest_table_page5': { top: '15%', height: '70%' },
  'location_block_page5': { top: '10%', height: '15%' },
  'services_inclus': { top: '10%', height: '25%' },
  'lease_back': { top: '38%', height: '25%' },
  'nos_options': { top: '66%', height: '25%' },
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
        >
          {/* Contenu statique de la page (placeholder) */}
          <div className="absolute inset-0 p-6 flex flex-col">
            {/* Header simulé */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="w-24 h-8 bg-gray-100 rounded" />
              <div className="text-xs text-gray-400">Page {selectedPageNumber}/8</div>
            </div>

            {/* Titre de la page */}
            <div className="mb-4">
              <div className="h-6 w-48 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>

            {/* Contenu placeholder selon le type de page */}
            {pageConfig?.type === 'static' && (
              <div className="flex-1 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-3 bg-gray-50 rounded" style={{ width: `${85 - i * 5}%` }} />
                ))}
              </div>
            )}

            {/* Zones dynamiques */}
            {dynamicZones.map((zone) => {
              const position = ZONE_POSITIONS[zone.id] || { top: '30%', height: '40%' };
              return (
                <DynamicZoneOverlay 
                  key={zone.id}
                  zone={zone}
                  style={{
                    position: 'absolute',
                    left: '5%',
                    right: '5%',
                    top: position.top,
                    height: position.height,
                  }}
                />
              );
            })}

            {/* Éléments éditables */}
            {pageContent?.elements
              .filter(e => !e.isDynamic)
              .map((element) => (
                <div
                  key={element.id}
                  className={cn(
                    "absolute cursor-pointer transition-all",
                    "border-2 rounded",
                    selectedElement?.id === element.id 
                      ? "border-primary ring-2 ring-primary/30" 
                      : "border-transparent hover:border-primary/50",
                    isEditable && "hover:bg-primary/5"
                  )}
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                  }}
                  onClick={() => isEditable && selectElement(element.id)}
                >
                  {element.type === 'text' && (
                    <div className="p-1 text-xs truncate">
                      {(element.content as { text?: string }).text || 'Texte...'}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-warning bg-warning/20" />
            <span>Zone dynamique (protégée)</span>
          </div>
          {isEditable && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded border-2 border-primary" />
              <span>Élément éditable</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
