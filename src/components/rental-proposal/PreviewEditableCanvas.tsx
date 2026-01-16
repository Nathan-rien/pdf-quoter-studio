/**
 * Canvas éditable pour l'aperçu de la proposition
 * Permet de modifier les éléments du template directement dans l'aperçu
 * Les zones dynamiques (produits, options) sont déplaçables mais pas modifiables
 */

import React, { useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Move } from 'lucide-react';
import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { cn } from '@/lib/utils';
import { ALLOWED_FONTS } from '@/lib/template-styles';
import { CANVAS_SCALE, PREVIEW_FONT_SCALE, PREVIEW_ICON_SCALE, LIST_INDENT_PX } from '@/lib/canvas-constants';
import { getSharedElementStyle, sortElementsByZIndex } from '@/lib/template-render-utils';
import type { EditableElement, TextContent, ImageContent, ShapeContent, IconContent } from '@/types/template-editor';
import type { PDFPageNumber, DynamicZone } from '@/types/pdf-template';

interface DynamicZoneWithBounds extends DynamicZone {
  bounds?: { x: number; y: number; width: number; height: number };
}

interface PreviewEditableCanvasProps {
  pageNumber: PDFPageNumber;
  elements: EditableElement[];
  dynamicZones?: DynamicZoneWithBounds[];
  renderDynamicContent?: () => React.ReactNode;
  pageFooter: React.ReactNode;
  isEditMode: boolean;
}

export function PreviewEditableCanvas({
  pageNumber,
  elements,
  dynamicZones = [],
  renderDynamicContent,
  pageFooter,
  isEditMode,
}: PreviewEditableCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    elementId: string | null;
    startX: number;
    startY: number;
    elementStartX: number;
    elementStartY: number;
  } | null>(null);
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    elementId: string | null;
    corner: string;
    startX: number;
    startY: number;
    elementStartWidth: number;
    elementStartHeight: number;
    elementStartX: number;
    elementStartY: number;
  } | null>(null);

  const { updateElementFromPreview } = useTemplateEditorStore();

  // Helper pour vérifier si un élément est verrouillé
  const isElementLocked = (element: EditableElement): boolean => {
    if (element.isDynamic) return true;
    if (element.type === 'shape') {
      const content = element.content as ShapeContent;
      return content.isLocked || false;
    }
    return false;
  };

  // Calcul des positions relatives au canvas
  const getCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_SCALE.width / rect.width;
    const scaleY = CANVAS_SCALE.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  // Gestion du drag
  const handleMouseDown = useCallback((e: React.MouseEvent, element: EditableElement) => {
    if (!isEditMode || isElementLocked(element)) return;
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    setSelectedId(element.id);
    setDragState({
      isDragging: true,
      elementId: element.id,
      startX: coords.x,
      startY: coords.y,
      elementStartX: element.position.x,
      elementStartY: element.position.y,
    });
  }, [isEditMode, getCanvasCoordinates]);

  // Gestion du resize
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, element: EditableElement, corner: string) => {
    if (!isEditMode || isElementLocked(element)) return;
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    setResizeState({
      isResizing: true,
      elementId: element.id,
      corner,
      startX: coords.x,
      startY: coords.y,
      elementStartWidth: element.size.width,
      elementStartHeight: element.size.height,
      elementStartX: element.position.x,
      elementStartY: element.position.y,
    });
  }, [isEditMode, getCanvasCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    if (dragState?.isDragging && dragState.elementId) {
      const deltaX = coords.x - dragState.startX;
      const deltaY = coords.y - dragState.startY;
      const element = elements.find(el => el.id === dragState.elementId);
      if (element) {
        const newX = Math.max(0, Math.min(CANVAS_SCALE.width - element.size.width, dragState.elementStartX + deltaX));
        const newY = Math.max(0, Math.min(CANVAS_SCALE.height - element.size.height, dragState.elementStartY + deltaY));
        
        updateElementFromPreview(element.id, pageNumber, { position: { x: newX, y: newY } });
      }
    }

    if (resizeState?.isResizing && resizeState.elementId) {
      const deltaX = coords.x - resizeState.startX;
      const deltaY = coords.y - resizeState.startY;
      const element = elements.find(el => el.id === resizeState.elementId);
      if (element) {
        let newWidth = resizeState.elementStartWidth;
        let newHeight = resizeState.elementStartHeight;
        let newX = resizeState.elementStartX;
        let newY = resizeState.elementStartY;

        if (resizeState.corner.includes('e')) {
          newWidth = Math.max(20, resizeState.elementStartWidth + deltaX);
        }
        if (resizeState.corner.includes('w')) {
          newWidth = Math.max(20, resizeState.elementStartWidth - deltaX);
          newX = resizeState.elementStartX + (resizeState.elementStartWidth - newWidth);
        }
        if (resizeState.corner.includes('s')) {
          newHeight = Math.max(20, resizeState.elementStartHeight + deltaY);
        }
        if (resizeState.corner.includes('n')) {
          newHeight = Math.max(20, resizeState.elementStartHeight - deltaY);
          newY = resizeState.elementStartY + (resizeState.elementStartHeight - newHeight);
        }

        updateElementFromPreview(element.id, pageNumber, { 
          position: { x: Math.max(0, newX), y: Math.max(0, newY) },
          size: { width: newWidth, height: newHeight }
        });
      }
    }
  }, [dragState, resizeState, elements, getCanvasCoordinates, updateElementFromPreview, pageNumber]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setResizeState(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
    }
  }, []);

  // Rendu du contenu texte
  const renderTextContent = (textContent: TextContent, elementId: string) => {
    const listType = textContent.listType || 'none';
    const indentLevel = textContent.indentLevel || 0;
    const indentPx = indentLevel * LIST_INDENT_PX;
    
    if (textContent.htmlContent) {
      return (
        <div 
          style={{ paddingLeft: `${indentPx}px` }}
          dangerouslySetInnerHTML={{ __html: textContent.htmlContent }}
        />
      );
    }
    
    const text = textContent.text || '';
    const lines = text.split('\n');
    return (
      <>
        {lines.map((line, i) => (
          <div key={`line-${elementId}-${i}`} style={{ paddingLeft: `${indentPx}px` }}>
            {listType === 'bullet' && '• '}
            {listType === 'numbered' && `${i + 1}. `}
            {line || '\u00A0'}
          </div>
        ))}
      </>
    );
  };

  // Poignées de redimensionnement
  const renderResizeHandles = (element: EditableElement) => {
    const corners = ['nw', 'ne', 'sw', 'se'];
    return corners.map(corner => (
      <div
        key={corner}
        className={cn(
          "absolute w-2 h-2 bg-primary rounded-full cursor-pointer z-50",
          corner === 'nw' && 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
          corner === 'ne' && 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
          corner === 'sw' && 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
          corner === 'se' && 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
        )}
        onMouseDown={(e) => handleResizeMouseDown(e, element, corner)}
      />
    ));
  };

  // Rendu d'un élément
  const renderElement = (element: EditableElement) => {
    const isSelected = selectedId === element.id;
    const locked = isElementLocked(element);
    const style = getSharedElementStyle({ element });

    // Wrapper pour le curseur et les events
    const wrapperClasses = cn(
      "transition-shadow",
      isEditMode && !locked && "cursor-move",
      isSelected && isEditMode && "ring-2 ring-primary ring-offset-1"
    );

    // Texte
    if (element.type === 'text') {
      const content = element.content as TextContent;
      const fontDef = ALLOWED_FONTS.find(f => f.name === content.fontFamily);
      const fontValue = fontDef?.value || 'Outfit, sans-serif';
      const scaledFontSize = Math.max(content.fontSize * PREVIEW_FONT_SCALE, 6);

      return (
        <div
          key={element.id}
          style={style}
          className={wrapperClasses}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <div 
            className="px-0.5 py-px"
            style={{
              fontFamily: fontValue,
              fontSize: `${scaledFontSize}px`,
              color: content.color || '#1f2937',
              fontWeight: content.bold ? 'bold' : 'normal',
              fontStyle: content.italic ? 'italic' : 'normal',
              textDecoration: content.underline ? 'underline' : 'none',
              lineHeight: 1.2,
              textAlign: content.textAlign || 'left',
              width: '100%',
            }}
          >
            <div className="whitespace-pre-wrap break-words">
              {renderTextContent(content, element.id)}
            </div>
          </div>
          {isSelected && isEditMode && !locked && renderResizeHandles(element)}
        </div>
      );
    }

    // Image
    if (element.type === 'image') {
      const content = element.content as ImageContent;
      return (
        <div
          key={element.id}
          style={{
            ...style,
            opacity: (content.opacity ?? 100) / 100,
          }}
          className={wrapperClasses}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {content.imageUrl && (
            <img
              src={content.imageUrl}
              alt={content.alt || 'Image'}
              className={`w-full h-full ${content.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
              style={{ transform: `rotate(${content.rotation || 0}deg)` }}
              draggable={false}
            />
          )}
          {isSelected && isEditMode && !locked && renderResizeHandles(element)}
        </div>
      );
    }

    // Forme
    if (element.type === 'shape') {
      const content = element.content as ShapeContent;
      const baseStyle: React.CSSProperties = {
        ...style,
        backgroundColor: content.backgroundColor !== 'transparent' 
          ? content.backgroundColor 
          : undefined,
        opacity: (content.backgroundOpacity ?? 100) / 100,
        borderRadius: content.shapeType === 'circle' || content.shapeType === 'ellipse'
          ? '50%'
          : `${content.cornerRadius || 0}px`,
        transform: `rotate(${content.rotation || 0}deg)`,
      };

      if (content.border?.enabled) {
        baseStyle.border = `${content.border.width}px solid ${content.border.color}`;
      }

      // Ligne
      if (content.shapeType === 'line' || content.shapeType === 'line-vertical') {
        const isVertical = content.shapeType === 'line-vertical';
        const lineStyle = content.lineStyle || 'solid';
        const lineWidth = content.border?.width || 2;
        const lineColor = content.border?.color || '#1f2937';
        
        return (
          <div
            key={element.id}
            style={style}
            className={wrapperClasses}
            onMouseDown={(e) => handleMouseDown(e, element)}
          >
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ 
                transform: content.rotation ? `rotate(${content.rotation}deg)` : undefined 
              }}
            >
              <div 
                style={{ 
                  width: isVertical ? lineWidth : '100%',
                  height: isVertical ? '100%' : lineWidth,
                  backgroundColor: lineStyle === 'solid' ? lineColor : 'transparent',
                  borderTop: !isVertical && lineStyle !== 'solid' 
                    ? `${lineWidth}px ${lineStyle} ${lineColor}` 
                    : undefined,
                  borderLeft: isVertical && lineStyle !== 'solid' 
                    ? `${lineWidth}px ${lineStyle} ${lineColor}` 
                    : undefined,
                }} 
              />
            </div>
            {isSelected && isEditMode && !locked && renderResizeHandles(element)}
          </div>
        );
      }

      return (
        <div 
          key={element.id} 
          style={baseStyle}
          className={wrapperClasses}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          {isSelected && isEditMode && !locked && renderResizeHandles(element)}
        </div>
      );
    }

    // Icône
    if (element.type === 'icon') {
      const content = element.content as IconContent;
      const IconComponent = (icons as Record<string, LucideIcon>)[content.iconName];
      if (!IconComponent) return null;
      
      const scaledSize = Math.max(content.size * PREVIEW_ICON_SCALE, 8);
      
      return (
        <div
          key={element.id}
          style={{
            ...style,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `rotate(${content.rotation || 0}deg)`,
          }}
          className={wrapperClasses}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <IconComponent
            size={scaledSize}
            color={content.color}
            strokeWidth={content.strokeWidth || 2}
          />
          {isSelected && isEditMode && !locked && renderResizeHandles(element)}
        </div>
      );
    }

    return null;
  };

  // Rendu d'une zone dynamique
  const renderDynamicZone = (zone: DynamicZoneWithBounds) => {
    // Utiliser bounds si disponible, sinon position
    const bounds = zone.bounds || {
      x: 0,
      y: (zone.position?.top || 0) * CANVAS_SCALE.height / 100,
      width: CANVAS_SCALE.width,
      height: (zone.position?.height || 50) * CANVAS_SCALE.height / 100,
    };

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${(bounds.x / CANVAS_SCALE.width) * 100}%`,
      top: `${(bounds.y / CANVAS_SCALE.height) * 100}%`,
      width: `${(bounds.width / CANVAS_SCALE.width) * 100}%`,
      height: `${(bounds.height / CANVAS_SCALE.height) * 100}%`,
    };

    return (
      <div
        key={zone.id}
        style={style}
        className={cn(
          "rounded border-2 border-dashed transition-colors pointer-events-none",
          isEditMode 
            ? "border-primary/50 bg-primary/5" 
            : "border-transparent"
        )}
      >
        {isEditMode && (
          <div className="absolute -top-5 left-1 flex items-center gap-1 text-[9px] text-primary">
            <Lock className="h-3 w-3" />
            <span>{zone.description || 'Zone dynamique'}</span>
          </div>
        )}
      </div>
    );
  };

  const sortedElements = sortElementsByZIndex(elements);

  return (
    <div
      ref={canvasRef}
      className={cn(
        "aspect-[210/297] bg-white rounded-lg ring-1 ring-border relative overflow-hidden",
        isEditMode && "ring-2 ring-primary/50"
      )}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Badge mode édition */}
      {isEditMode && (
        <Badge 
          variant="default" 
          className="absolute top-2 right-2 z-50 gap-1 text-[9px]"
        >
          <Move className="h-3 w-3" />
          Édition
        </Badge>
      )}

      {/* Éléments du template */}
      {sortedElements.map(el => renderElement(el))}

      {/* Zones dynamiques */}
      {dynamicZones.map(zone => renderDynamicZone(zone))}

      {/* Contenu dynamique (non éditable) */}
      {renderDynamicContent && (
        <div className="pointer-events-none">
          {renderDynamicContent()}
        </div>
      )}

      {/* Footer pagination */}
      {pageFooter}
    </div>
  );
}
