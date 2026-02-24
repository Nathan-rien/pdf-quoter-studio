/**
 * Canvas éditable pour l'aperçu de la proposition
 * Permet de modifier les éléments du template directement dans l'aperçu
 * Les zones dynamiques (produits, options) sont déplaçables mais pas modifiables
 */

import React, { useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock, Move } from 'lucide-react';
import { InlineTextEditor } from '@/components/template-editor/InlineTextEditor';
import { icons } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/templateEditorStore';
import { cn } from '@/lib/utils';
import { ALLOWED_FONTS } from '@/lib/template-styles';
import { CANVAS_SCALE, PREVIEW_FONT_SCALE, PREVIEW_ICON_SCALE, LIST_INDENT_PX } from '@/lib/canvas-constants';
import { getSharedElementStyle, sortElementsByZIndex } from '@/lib/template-render-utils';
import { sanitizeHtml } from '@/lib/sanitize-html';
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
  renderOverlayContent?: () => React.ReactNode;
  pageFooter: React.ReactNode;
  isEditMode: boolean;
  dynamicContentOffset?: { x: number; y: number; scaleX?: number; scaleY?: number };
  onDynamicContentDrag?: (offset: { x: number; y: number }) => void;
  onDynamicContentScale?: (scaleX: number, scaleY: number) => void;
}

export function PreviewEditableCanvas({
  pageNumber,
  elements,
  dynamicZones = [],
  renderDynamicContent,
  renderOverlayContent,
  pageFooter,
  isEditMode,
  dynamicContentOffset,
  onDynamicContentDrag,
  onDynamicContentScale,
}: PreviewEditableCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
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
  const [dynamicDragState, setDynamicDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    offsetStartX: number;
    offsetStartY: number;
  } | null>(null);
  const [dynamicResizeState, setDynamicResizeState] = useState<{
    isResizing: boolean;
    corner: string;
    startX: number;
    startY: number;
    startScaleX: number;
    startScaleY: number;
    containerWidth: number;
    containerHeight: number;
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
    if (!isEditMode || isElementLocked(element) || inlineEditingId === element.id) return;
    e.preventDefault(); // Empêche la sélection de texte pendant le drag
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
    e.preventDefault(); // Empêche la sélection de texte pendant le resize
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

  // Gestion du drag pour le contenu dynamique
  const handleDynamicMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || !onDynamicContentDrag) return;
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    setDynamicDragState({
      isDragging: true,
      startX: coords.x,
      startY: coords.y,
      offsetStartX: dynamicContentOffset?.x || 0,
      offsetStartY: dynamicContentOffset?.y || 0,
    });
  }, [isEditMode, onDynamicContentDrag, getCanvasCoordinates, dynamicContentOffset]);

  // Gestion du resize pour le contenu dynamique
  const handleDynamicResizeMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    if (!isEditMode || !onDynamicContentScale) return;
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCanvasCoordinates(e.clientX, e.clientY);
    // Get the dynamic content wrapper dimensions from the canvas
    const wrapper = (e.target as HTMLElement).closest('[data-dynamic-wrapper]');
    const wrapperRect = wrapper?.getBoundingClientRect();
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    
    const containerWidth = wrapperRect && canvasRect 
      ? (wrapperRect.width / canvasRect.width) * CANVAS_SCALE.width 
      : CANVAS_SCALE.width;
    const containerHeight = wrapperRect && canvasRect 
      ? (wrapperRect.height / canvasRect.height) * CANVAS_SCALE.height 
      : CANVAS_SCALE.height * 0.5;
    
    setDynamicResizeState({
      isResizing: true,
      corner,
      startX: coords.x,
      startY: coords.y,
      startScaleX: dynamicContentOffset?.scaleX ?? 1,
      startScaleY: dynamicContentOffset?.scaleY ?? 1,
      containerWidth,
      containerHeight,
    });
  }, [isEditMode, onDynamicContentScale, getCanvasCoordinates, dynamicContentOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const coords = getCanvasCoordinates(e.clientX, e.clientY);

    // Dynamic content resize
    if (dynamicResizeState?.isResizing && onDynamicContentScale) {
      const deltaX = coords.x - dynamicResizeState.startX;
      const deltaY = coords.y - dynamicResizeState.startY;
      
      let scaleFactorX = dynamicResizeState.startScaleX;
      let scaleFactorY = dynamicResizeState.startScaleY;
      
      const corner = dynamicResizeState.corner;
      if (corner.includes('e')) {
        scaleFactorX = dynamicResizeState.startScaleX + deltaX / dynamicResizeState.containerWidth;
      }
      if (corner.includes('w')) {
        scaleFactorX = dynamicResizeState.startScaleX - deltaX / dynamicResizeState.containerWidth;
      }
      if (corner.includes('s')) {
        scaleFactorY = dynamicResizeState.startScaleY + deltaY / dynamicResizeState.containerHeight;
      }
      if (corner.includes('n')) {
        scaleFactorY = dynamicResizeState.startScaleY - deltaY / dynamicResizeState.containerHeight;
      }
      
      // Clamp between 0.3 and 1.5
      scaleFactorX = Math.max(0.3, Math.min(1.5, scaleFactorX));
      scaleFactorY = Math.max(0.3, Math.min(1.5, scaleFactorY));
      
      onDynamicContentScale(scaleFactorX, scaleFactorY);
      return;
    }

    // Dynamic content drag
    if (dynamicDragState?.isDragging && onDynamicContentDrag) {
      const deltaX = coords.x - dynamicDragState.startX;
      const deltaY = coords.y - dynamicDragState.startY;
      onDynamicContentDrag({
        x: dynamicDragState.offsetStartX + deltaX,
        y: dynamicDragState.offsetStartY + deltaY,
      });
      return;
    }

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
  }, [dragState, resizeState, dynamicDragState, dynamicResizeState, elements, getCanvasCoordinates, updateElementFromPreview, pageNumber, onDynamicContentDrag, onDynamicContentScale]);

  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setResizeState(null);
    setDynamicDragState(null);
    setDynamicResizeState(null);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedId(null);
      if (inlineEditingId) setInlineEditingId(null);
    }
  }, [inlineEditingId]);

  // Double-clic pour édition inline des textes
  const handleDoubleClick = useCallback((e: React.MouseEvent, element: EditableElement) => {
    if (!isEditMode || isElementLocked(element) || element.type !== 'text') return;
    e.preventDefault();
    e.stopPropagation();
    setInlineEditingId(element.id);
  }, [isEditMode]);

  // Rendu du contenu texte
  const renderTextContent = (textContent: TextContent, elementId: string) => {
    const listType = textContent.listType || 'none';
    const indentLevel = textContent.indentLevel || 0;
    const indentPx = indentLevel * LIST_INDENT_PX;
    
    if (textContent.htmlContent) {
      return (
        <div 
          key={`html-${elementId}-${textContent.htmlContent.length}`}
          style={{ paddingLeft: `${indentPx}px` }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(textContent.htmlContent) }}
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
          "absolute w-4 h-4 bg-primary border-2 border-white rounded-full cursor-pointer z-50 shadow-md",
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
          onDoubleClick={(e) => handleDoubleClick(e, element)}
        >
          {inlineEditingId === element.id ? (
            <InlineTextEditor
              content={content}
              onContentChange={(html, plainText) => {
                updateElementFromPreview(element.id, pageNumber, {
                  content: { htmlContent: html, text: plainText },
                });
              }}
              onExit={() => setInlineEditingId(null)}
              style={{
                fontFamily: fontValue,
                fontSize: `${scaledFontSize}px`,
                color: content.color || '#1f2937',
                fontWeight: content.bold ? 'bold' : 'normal',
                fontStyle: content.italic ? 'italic' : 'normal',
                textDecoration: content.underline ? 'underline' : 'none',
                lineHeight: 1.2,
                textAlign: (content.textAlign || 'left') as any,
              }}
            />
          ) : (
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
          )}
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

      {/* Éléments du template - wrapper stable pour éviter les erreurs removeChild */}
      <React.Fragment key={`canvas-elements-${pageNumber}`}>
        {sortedElements.map(el => renderElement(el))}
      </React.Fragment>

      {/* Zones dynamiques */}
      {dynamicZones.map(zone => renderDynamicZone(zone))}

      {/* Contenu overlay (rendu directement dans le canvas, hors du wrapper dynamique) */}
      {renderOverlayContent?.()}

      {/* Contenu dynamique (déplaçable et redimensionnable en mode édition) */}
      {renderDynamicContent && (
        <div 
          data-dynamic-wrapper
          className={cn(
            "absolute inset-0",
            isEditMode && onDynamicContentDrag
              ? "cursor-move"
              : "pointer-events-none"
          )}
          style={{
            transform: dynamicContentOffset 
              ? `translate(${(dynamicContentOffset.x / CANVAS_SCALE.width) * 100}%, ${(dynamicContentOffset.y / CANVAS_SCALE.height) * 100}%) scale(${dynamicContentOffset.scaleX ?? 1}, ${dynamicContentOffset.scaleY ?? 1})`
              : undefined,
            transformOrigin: 'top left',
          }}
          onMouseDown={handleDynamicMouseDown}
        >
          {isEditMode && onDynamicContentDrag && (
            <Badge 
              variant="secondary" 
              className="absolute top-1 left-1 z-50 gap-1 text-[8px] py-0 px-1.5"
            >
              <Move className="h-2.5 w-2.5" />
              Déplacer / Redimensionner
            </Badge>
          )}
          {renderDynamicContent()}
          {/* Poignées de redimensionnement pour le contenu dynamique */}
          {isEditMode && onDynamicContentScale && (
            <>
              {(['nw', 'ne', 'sw', 'se'] as const).map(corner => (
                <div
                  key={`dynamic-resize-${corner}`}
                  className={cn(
                    "absolute w-5 h-5 bg-primary border-2 border-white rounded-full z-50 shadow-lg ring-2 ring-primary/40 animate-pulse",
                    corner === 'nw' && 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
                    corner === 'ne' && 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
                    corner === 'sw' && 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
                    corner === 'se' && 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
                  )}
                  onMouseDown={(e) => handleDynamicResizeMouseDown(e, corner)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Footer pagination */}
      {pageFooter}
    </div>
  );
}
