/**
 * Canvas de l'éditeur - Visualisation et édition de la page
 * Affiche les éléments réels du PDF avec sélection interactive et drag & drop
 */

import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DynamicZoneOverlay } from "./DynamicZoneOverlay";
import { FloatingToolbar } from "./FloatingToolbar";
import { InlineTextEditor } from "./InlineTextEditor";
import { PDF_TEMPLATE_CONTRACT } from "@/lib/pdf-template-contract";
import { getDynamicZonesForPage } from "@/lib/template-protection";
import { cn } from "@/lib/utils";
import { ALLOWED_FONTS } from "@/lib/template-styles";
import { CANVAS_SCALE, CANVAS_DISPLAY_MAX_WIDTH } from "@/lib/canvas-constants";
import { getSharedElementStyle, resolveImageUrl, sortElementsByZIndex } from '@/lib/template-render-utils';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { FileText, Lock, Eye, Edit3, Type, Image as ImageIcon, Square, Circle, Minus, Sparkles } from "lucide-react";
import { icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PDFPageNumber } from "@/types/pdf-template";
import type { TextContent, ImageContent, ShapeContent, IconContent, TextAlign, AllowedFontSize } from "@/types/template-editor";
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

// CANVAS_SCALE importé depuis canvas-constants.ts pour garantir la synchronisation

export function EditorCanvas() {
  const { 
    selectedPageNumber, 
    currentVersion,
    editorMode,
    selectedElementId,
    selectedElementIds,
    selectedDynamicZoneId,
    addElementMode,
    selectedShapeType,
    selectedIconName,
    selectedLogoId,
    inlineEditingElementId,
    selectElement,
    toggleElementSelection,
    selectMultipleElements,
    clearSelection,
    selectDynamicZone,
    addElement,
    addShape,
    addIcon,
    addLogo,
    setAddElementMode,
    setInlineEditing,
    updateElementPosition,
    updateElementSize,
    updateTextContent,
    updateDynamicZonePosition,
    moveSelectedElements,
    copySelectedElements,
    pasteElements,
    deleteSelectedElements,
    undo
  } = useTemplateEditorStore();

  // États pour le drag & drop
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number; posX: number; posY: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number; y?: number; centerX?: boolean; centerY?: boolean }>({});
  
  // États pour la sélection lasso
  const [isLassoing, setIsLassoing] = useState(false);
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);
  const justFinishedLassoRef = useRef(false);
  
  // État pour la position de la toolbar flottante
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  // Flag pour savoir si on doit recalculer la position de la toolbar
  const [needsToolbarReposition, setNeedsToolbarReposition] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editingElementRef = useRef<HTMLDivElement>(null);

  // Seuil de snap pour les guides (en pixels canvas)
  const SNAP_THRESHOLD = 8;
  const MIN_SIZE = 20; // Taille minimale d'un élément
  const MOVE_STEP = 10; // Pas de déplacement normal (pixels)
  const MOVE_STEP_FINE = 1; // Pas de déplacement fin avec Shift (pixels)
  const LASSO_MIN_SIZE = 5; // Taille minimale du lasso pour déclencher une sélection

  // Raccourcis clavier pour déplacer, copier et coller les éléments
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // IMPORTANT: Ignorer TOUS les raccourcis clavier si on est en édition inline
    // Laisser l'InlineTextEditor gérer ses propres événements (Delete, Backspace, etc.)
    if (inlineEditingElementId) {
      return;
    }

    // Copier (Ctrl+C / Cmd+C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (selectedElementIds.length > 0) {
        copySelectedElements();
        toast.success(`${selectedElementIds.length} élément(s) copié(s)`);
        e.preventDefault();
      }
      return;
    }
    
    // Coller (Ctrl+V / Cmd+V)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      if (currentVersion?.status === 'brouillon' && editorMode === 'edit') {
        const pasted = pasteElements();
        if (pasted.length > 0) {
          toast.success(`${pasted.length} élément(s) collé(s)`);
        }
        e.preventDefault();
      }
      return;
    }
    
    // Annuler (Ctrl+Z / Cmd+Z)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (currentVersion?.status === 'brouillon' && editorMode === 'edit') {
        const undone = undo();
        if (undone) {
          toast.success('Action annulée');
        }
        e.preventDefault();
      }
      return;
    }
    
    // Supprimer (Delete / Backspace)
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedElementIds.length > 0 && currentVersion?.status === 'brouillon' && editorMode === 'edit') {
        const count = deleteSelectedElements();
        if (count > 0) {
          toast.success(`${count} élément(s) supprimé(s)`);
        }
        e.preventDefault();
      }
      return;
    }
    
    // Vérifier qu'on a des éléments sélectionnés et qu'on est en mode édition
    if (selectedElementIds.length === 0 || !currentVersion || currentVersion.status !== 'brouillon' || editorMode !== 'edit') {
      return;
    }
    
    const step = e.shiftKey ? MOVE_STEP_FINE : MOVE_STEP;
    let moved = false;
    
    switch (e.key) {
      case 'ArrowUp':
        moved = moveSelectedElements(0, -step);
        break;
      case 'ArrowDown':
        moved = moveSelectedElements(0, step);
        break;
      case 'ArrowLeft':
        moved = moveSelectedElements(-step, 0);
        break;
      case 'ArrowRight':
        moved = moveSelectedElements(step, 0);
        break;
    }
    
    if (moved) {
      e.preventDefault();
    }
  }, [inlineEditingElementId, selectedElementIds, currentVersion, editorMode, moveSelectedElements, copySelectedElements, pasteElements, deleteSelectedElements, undo]);

  // Focus sur le conteneur pour capturer les événements clavier
  useEffect(() => {
    if (selectedElementIds.length > 0 && containerRef.current) {
      containerRef.current.focus();
    }
  }, [selectedElementIds]);

  // Fonction pour repositionner la toolbar dynamiquement
  const repositionToolbar = useCallback(() => {
    if (!inlineEditingElementId || !canvasRef.current || !toolbarRef.current || !editingElementRef.current) {
      return;
    }

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const elementRect = editingElementRef.current.getBoundingClientRect();
    const toolbarRect = toolbarRef.current.getBoundingClientRect();

    // Position relative au canvas (px)
    const elementTopInCanvas = elementRect.top - canvasRect.top;
    const elementBottomInCanvas = elementRect.bottom - canvasRect.top;
    const centerX = elementRect.left - canvasRect.left + elementRect.width / 2;

    const toolbarHeight = toolbarRect.height;
    const toolbarWidth = toolbarRect.width;
    
    // Marge augmentée entre l'élément et la toolbar pour éviter l'obstruction
    const gapAbove = 16;
    const gapBelow = 16;

    // Calculer les positions candidates avec les marges augmentées
    const aboveY = elementTopInCanvas - toolbarHeight - gapAbove;
    const belowY = elementBottomInCanvas + gapBelow;

    // Vérifier si on peut placer au-dessus (avec marge de sécurité)
    const canPlaceAbove = aboveY >= 12;
    // Vérifier si on peut placer en-dessous (avec marge de sécurité)
    const canPlaceBelow = belowY + toolbarHeight <= canvasRect.height - 12;

    // Choisir la meilleure position
    let finalY: number;
    if (canPlaceAbove) {
      finalY = aboveY;
    } else if (canPlaceBelow) {
      finalY = belowY;
    } else {
      // Fallback: placer en haut du canvas avec un minimum de marge
      finalY = 8;
    }

    // Clamp horizontal avec plus de marge pour éviter les débordements
    const minX = toolbarWidth / 2 + 12;
    const maxX = canvasRect.width - toolbarWidth / 2 - 12;
    const clampedX = Math.max(minX, Math.min(centerX, maxX));

    setToolbarPosition({
      x: clampedX,
      y: Math.max(8, finalY),
    });
  }, [inlineEditingElementId]);

  // Repositionner la toolbar après le rendu de l'éditeur inline
  useLayoutEffect(() => {
    if (needsToolbarReposition && inlineEditingElementId) {
      // Utiliser requestAnimationFrame pour attendre que le DOM soit peint
      const rafId = requestAnimationFrame(() => {
        repositionToolbar();
        setNeedsToolbarReposition(false);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [needsToolbarReposition, inlineEditingElementId, repositionToolbar]);

  // Observer les changements de taille de l'élément en édition
  useEffect(() => {
    if (!inlineEditingElementId || !editingElementRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      repositionToolbar();
    });

    resizeObserver.observe(editingElementRef.current);
    return () => resizeObserver.disconnect();
  }, [inlineEditingElementId, repositionToolbar]);

  // Repositionner sur resize de fenêtre
  useEffect(() => {
    if (!inlineEditingElementId) return;

    const handleWindowResize = () => {
      repositionToolbar();
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [inlineEditingElementId, repositionToolbar]);

  const pageConfig = PDF_TEMPLATE_CONTRACT.pages.find(
    p => p.pageNumber === selectedPageNumber
  );
  
  // Utiliser les zones dynamiques depuis la version courante (avec positions personnalisées)
  const pageContent = currentVersion?.pages.find(p => p.pageNumber === selectedPageNumber);
  const dynamicZones = pageContent?.dynamicZones || [];
  
  const isEditable = currentVersion?.status === 'brouillon' && editorMode === 'edit';
  const isAddMode = addElementMode !== 'none';
  const isInlineEditing = inlineEditingElementId !== null;

  // Élément en édition inline
  const inlineEditingElement = inlineEditingElementId 
    ? pageContent?.elements.find(e => e.id === inlineEditingElementId)
    : null;
  const inlineTextContent = inlineEditingElement?.type === 'text' 
    ? inlineEditingElement.content as TextContent 
    : null;

  // Fonction unifiée de calcul des styles - utilise getSharedElementStyle pour garantir la fidélité WYSIWYG
  const getElementStyle = (element: { position: { x: number; y: number }; size: { width: number; height: number }; type?: string; zIndex?: number; content?: unknown }) => {
    // Convertir en format attendu par getSharedElementStyle
    const fullElement = {
      id: '',
      type: element.type || 'text',
      pageNumber: selectedPageNumber,
      isDynamic: false,
      position: element.position,
      size: element.size,
      content: element.content || {},
      zIndex: element.zIndex || 1,
    } as import('@/types/template-editor').EditableElement;
    
    return getSharedElementStyle({ element: fullElement });
  };

  // Drag & Drop handlers
  const handleMouseDown = useCallback((elementId: string, e: React.MouseEvent) => {
    if (!isEditable || isAddMode || isInlineEditing) return;
    
    const element = pageContent?.elements.find(el => el.id === elementId);
    if (!element || element.isDynamic) return;
    
    // Ne pas démarrer le drag si c'est un potentiel double-clic
    // On vérifie si l'élément texte vient d'être cliqué
    if (element.type === 'text' && e.detail === 1) {
      // Simple clic - ne pas démarrer le drag tout de suite
      // Le drag sera activé si l'utilisateur bouge la souris
    }
    
    e.stopPropagation();
    
    // Multi-sélection avec Ctrl ou Cmd - ne pas démarrer le drag
    if (e.ctrlKey || e.metaKey) {
      toggleElementSelection(elementId);
      return; // Ne pas démarrer le drag pour la multi-sélection
    }
    
    // Si l'élément n'est pas déjà dans la sélection, le sélectionner seul
    if (!selectedElementIds.includes(elementId)) {
      selectElement(elementId);
    }
    // Sinon, garder la multi-sélection actuelle pour pouvoir déplacer le groupe
    
    // Démarrer le drag uniquement pour un clic simple
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
  }, [isEditable, isAddMode, pageContent, selectElement, toggleElementSelection, selectedElementIds]);

  // Handler pour démarrer le resize
  const handleResizeMouseDown = useCallback((elementId: string, handle: 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent) => {
    if (!isEditable || isAddMode) return;
    
    const element = pageContent?.elements.find(el => el.id === elementId);
    if (!element || element.isDynamic) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size.width,
      height: element.size.height,
      posX: element.position.x,
      posY: element.position.y
    });
    setResizeHandle(handle);
    setIsResizing(true);
    selectElement(elementId);
  }, [isEditable, isAddMode, pageContent, selectElement]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    // Resize d'un élément
    if (isResizing && selectedElementId && resizeStart && resizeHandle) {
      const element = pageContent?.elements.find(el => el.id === selectedElementId);
      if (!element) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_SCALE.width / canvasRect.width;
      const scaleY = CANVAS_SCALE.height / canvasRect.height;
      
      const deltaX = (e.clientX - resizeStart.x) * scaleX;
      const deltaY = (e.clientY - resizeStart.y) * scaleY;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.posX;
      let newY = resizeStart.posY;
      
      // Calculer les nouvelles dimensions selon la poignée
      switch (resizeHandle) {
        case 'se': // Coin bas-droite
          newWidth = Math.max(MIN_SIZE, resizeStart.width + deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStart.height + deltaY);
          break;
        case 'sw': // Coin bas-gauche
          newWidth = Math.max(MIN_SIZE, resizeStart.width - deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStart.height + deltaY);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
          break;
        case 'ne': // Coin haut-droite
          newWidth = Math.max(MIN_SIZE, resizeStart.width + deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStart.height - deltaY);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
          break;
        case 'nw': // Coin haut-gauche
          newWidth = Math.max(MIN_SIZE, resizeStart.width - deltaX);
          newHeight = Math.max(MIN_SIZE, resizeStart.height - deltaY);
          newX = resizeStart.posX + (resizeStart.width - newWidth);
          newY = resizeStart.posY + (resizeStart.height - newHeight);
          break;
      }
      
      // Clamper les valeurs - permettre d'atteindre les bords (0)
      newX = Math.max(0, Math.min(newX, CANVAS_SCALE.width - MIN_SIZE));
      newY = Math.max(0, Math.min(newY, CANVAS_SCALE.height - MIN_SIZE));
      // Permettre à l'élément d'occuper toute la largeur/hauteur disponible
      newWidth = Math.min(newWidth, CANVAS_SCALE.width - newX);
      newHeight = Math.min(newHeight, CANVAS_SCALE.height - newY);
      
      updateElementSize(selectedElementId, {
        width: Math.round(newWidth),
        height: Math.round(newHeight)
      });
      
      if (newX !== element.position.x || newY !== element.position.y) {
        updateElementPosition(selectedElementId, {
          x: Math.round(newX),
          y: Math.round(newY)
        });
      }
      
      return;
    }
    
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
      
      // Permettre de déplacer jusqu'aux bords absolus du canvas (0 = bord gauche/haut)
      // L'élément peut déborder du canvas côté droit/bas si l'utilisateur le souhaite
      const clampedX = Math.max(0, x);
      const clampedY = Math.max(0, y);
      
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
    
    // Mise à jour du lasso
    if (isLassoing && lassoStart) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - canvasRect.left) / canvasRect.width) * CANVAS_SCALE.width;
      const y = ((e.clientY - canvasRect.top) / canvasRect.height) * CANVAS_SCALE.height;
      setLassoEnd({ x, y });
    }
  }, [isDragging, isDraggingZone, isResizing, isLassoing, lassoStart, selectedElementId, selectedDynamicZoneId, dragOffset, resizeStart, resizeHandle, pageContent, dynamicZones, updateElementPosition, updateElementSize, updateDynamicZonePosition]);

  const handleMouseUp = useCallback(() => {
    // Finaliser le lasso et sélectionner les éléments
    if (isLassoing && lassoStart && lassoEnd && pageContent) {
      const lassoWidth = Math.abs(lassoEnd.x - lassoStart.x);
      const lassoHeight = Math.abs(lassoEnd.y - lassoStart.y);
      
      // Ne sélectionner que si le lasso est assez grand
      if (lassoWidth > LASSO_MIN_SIZE || lassoHeight > LASSO_MIN_SIZE) {
        const minX = Math.min(lassoStart.x, lassoEnd.x);
        const maxX = Math.max(lassoStart.x, lassoEnd.x);
        const minY = Math.min(lassoStart.y, lassoEnd.y);
        const maxY = Math.max(lassoStart.y, lassoEnd.y);
        
        // Trouver les éléments qui intersectent avec le rectangle de sélection
        const intersectingIds = pageContent.elements
          .filter(el => {
            if (el.isDynamic) return false;
            
            const elLeft = el.position.x;
            const elRight = el.position.x + el.size.width;
            const elTop = el.position.y;
            const elBottom = el.position.y + el.size.height;
            
            // Vérifier l'intersection
            return !(elRight < minX || elLeft > maxX || elBottom < minY || elTop > maxY);
          })
          .map(el => el.id);
        
        if (intersectingIds.length > 0) {
          selectMultipleElements(intersectingIds);
          // Marquer qu'on vient de finir un lasso avec sélection pour éviter que onClick efface
          justFinishedLassoRef.current = true;
          setTimeout(() => { justFinishedLassoRef.current = false; }, 0);
        }
      }
    }
    
    setIsLassoing(false);
    setLassoStart(null);
    setLassoEnd(null);
    setIsDragging(false);
    setIsDraggingZone(false);
    setIsResizing(false);
    setResizeHandle(null);
    setResizeStart(null);
    setAlignmentGuides({});
  }, [isLassoing, lassoStart, lassoEnd, pageContent, selectMultipleElements]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging || isDraggingZone || isResizing || isLassoing) {
      setIsLassoing(false);
      setLassoStart(null);
      setLassoEnd(null);
      setIsDragging(false);
      setIsDraggingZone(false);
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
      setAlignmentGuides({});
    }
  }, [isDragging, isDraggingZone, isResizing, isLassoing]);

  // Handler pour démarrer le lasso sur le canvas
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Ne pas démarrer le lasso si on clique sur un élément ou en mode ajout
    if (isAddMode || !isEditable) return;
    
    // Vérifier qu'on clique bien sur le canvas (ou ses enfants directs de décoration, pas sur un élément interactif)
    const target = e.target as HTMLElement;
    // Si on clique sur un élément avec data-element-id, c'est un élément interactif
    if (target.closest('[data-element-id]')) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_SCALE.width;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_SCALE.height;
    
    setLassoStart({ x, y });
    setLassoEnd({ x, y });
    setIsLassoing(true);
    
    // Empêcher la sélection de texte pendant le lasso
    e.preventDefault();
  }, [isAddMode, isEditable]);

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
    if (isDragging || isInlineEditing) return;
    
    // Multi-sélection avec Ctrl ou Cmd
    if (e.ctrlKey || e.metaKey) {
      toggleElementSelection(elementId);
    } else {
      selectElement(elementId);
    }
    
    // Afficher un hint si en mode lecture seule
    if (!isEditable && currentVersion?.status !== 'brouillon') {
      toast.info("Version publiée en lecture seule. Cliquez sur 'Éditer' pour créer un brouillon.", {
        id: 'readonly-hint',
        duration: 3000
      });
    }
  };

  // Double-clic pour l'édition inline du texte
  const handleElementDoubleClick = useCallback((elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isEditable) {
      toast.info("Passez en mode édition pour modifier le texte", { id: 'edit-mode-hint' });
      return;
    }
    
    const element = pageContent?.elements.find(el => el.id === elementId);
    if (!element || element.isDynamic || element.type !== 'text') return;
    
    // Activer l'édition inline
    selectElement(elementId);
    setInlineEditing(elementId);
    
    // Déclencher le repositionnement de la toolbar après le rendu
    // On initialise avec une position temporaire, le repositionnement se fera via useLayoutEffect
    if (canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = targetRect.left - canvasRect.left + targetRect.width / 2;
      
      // Position initiale temporaire (sera recalculée)
      setToolbarPosition({
        x: Math.max(100, Math.min(centerX, canvasRect.width - 100)),
        y: -1000, // Hors écran temporairement
      });
      setNeedsToolbarReposition(true);
    }
    
    toast.success("Mode édition activé - modifiez le texte directement", { id: 'inline-edit', duration: 2000 });
  }, [isEditable, pageContent, selectElement, setInlineEditing]);

  // Fermer l'édition inline
  const handleExitInlineEditing = useCallback(() => {
    setInlineEditing(null);
    setToolbarPosition(null);
  }, [setInlineEditing]);

  // Mettre à jour le contenu du texte depuis l'éditeur inline
  const handleInlineContentChange = useCallback((html: string, plainText: string) => {
    if (inlineEditingElementId) {
      updateTextContent(inlineEditingElementId, { 
        htmlContent: html,
        text: plainText 
      });
    }
  }, [inlineEditingElementId, updateTextContent]);

  // Actions de la toolbar flottante
  const handleToolbarBold = useCallback(() => {
    document.execCommand('bold', false);
  }, []);

  const handleToolbarItalic = useCallback(() => {
    document.execCommand('italic', false);
  }, []);

  const handleToolbarUnderline = useCallback(() => {
    document.execCommand('underline', false);
  }, []);

  const handleToolbarBulletList = useCallback(() => {
    document.execCommand('insertUnorderedList', false);
  }, []);

  const handleToolbarNumberedList = useCallback(() => {
    document.execCommand('insertOrderedList', false);
  }, []);

  const handleToolbarAlignChange = useCallback((align: TextAlign) => {
    if (inlineEditingElementId) {
      updateTextContent(inlineEditingElementId, { textAlign: align });
    }
  }, [inlineEditingElementId, updateTextContent]);

  const handleToolbarFontSizeChange = useCallback((size: AllowedFontSize) => {
    if (inlineEditingElementId) {
      updateTextContent(inlineEditingElementId, { fontSize: size });
    }
  }, [inlineEditingElementId, updateTextContent]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ne pas réagir au click si on vient de terminer un lasso ou un drag
    if (isDragging || isDraggingZone || isResizing) return;
    
    // Si on vient de finir un lasso avec sélection, ne pas clear
    if (justFinishedLassoRef.current) return;
    
    // Si en édition inline, vérifier où on clique
    if (isInlineEditing) {
      const target = e.target as HTMLElement;
      // Ne pas fermer si on clique sur la toolbar ou l'éditeur inline
      if (target.closest('[data-floating-toolbar]') || target.closest('[contenteditable]')) return;
      handleExitInlineEditing();
      return;
    }
    
    // Si on a cliqué sur un élément, laisser handleElementClick gérer
    const target = e.target as HTMLElement;
    if (target.closest('[data-element-id]')) return;
    
    // Mode ajout d'élément
    if (isAddMode && isEditable) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * CANVAS_SCALE.width;
      const y = ((e.clientY - rect.top) / rect.height) * CANVAS_SCALE.height;
      
      try {
        if (addElementMode === 'logo' && selectedLogoId) {
          addLogo(selectedLogoId, { x: Math.round(x), y: Math.round(y) });
          toast.success(`Logo ajouté`);
        } else if (addElementMode === 'icon' && selectedIconName) {
          addIcon(selectedIconName, { x: Math.round(x), y: Math.round(y) });
          toast.success(`Icône ajoutée`);
        } else if (addElementMode === 'shape' && selectedShapeType) {
          addShape(selectedShapeType, { x: Math.round(x), y: Math.round(y) });
          toast.success(`Forme ajoutée`);
        } else if (addElementMode === 'text' || addElementMode === 'image') {
          addElement(addElementMode, { x: Math.round(x), y: Math.round(y) });
          toast.success(`${addElementMode === 'image' ? 'Image' : 'Texte'} ajouté(e)`);
        }
      } catch (error) {
        toast.error("Erreur lors de l'ajout de l'élément");
      }
      return;
    }
    
    // Clear seulement sur un clic simple sur le canvas vide
    clearSelection();
    selectDynamicZone(null);
  };

  const handleCancelAddMode = () => {
    setAddElementMode('none');
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3 flex-row items-center justify-between shrink-0">
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
      
      <CardContent className="p-4 flex-1 overflow-auto">
        {/* Conteneur focusable pour les raccourcis clavier */}
        <div
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="outline-none min-h-fit"
        >
          {/* Message mode ajout */}
          {isAddMode && (
            <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between">
              <p className="text-sm text-primary">
                Cliquez sur le canvas pour placer {addElementMode === 'logo' ? 'le logo' : addElementMode === 'icon' ? 'l\'icône' : addElementMode === 'image' ? 'l\'image' : addElementMode === 'shape' ? 'la forme' : 'le texte'}
              </p>
              <Button variant="ghost" size="sm" onClick={handleCancelAddMode}>
                Annuler
              </Button>
            </div>
          )}

          {/* Canvas A4 simulé - utilise ring au lieu de border pour ne pas affecter la surface utile */}
          <div 
            ref={canvasRef}
            className={cn(
              "relative mx-auto bg-white rounded-lg shadow-lg overflow-hidden",
              "ring-2",
              isEditable ? "ring-primary/30" : "ring-border",
              isAddMode && "cursor-crosshair",
              (isDragging || isDraggingZone) && "cursor-grabbing",
              isResizing && "cursor-nwse-resize",
              isLassoing && "cursor-crosshair"
            )}
            style={{
              width: '100%',
              maxWidth: `${CANVAS_DISPLAY_MAX_WIDTH}px`,
              aspectRatio: '210 / 297', // A4 ratio
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
          {/* Barre d'outils flottante pour l'édition inline */}
          {isInlineEditing && inlineTextContent && toolbarPosition && (
            <FloatingToolbar
              ref={toolbarRef}
              position={toolbarPosition}
              fontSize={inlineTextContent.fontSize}
              textAlign={inlineTextContent.textAlign || 'left'}
              onFontSizeChange={handleToolbarFontSizeChange}
              onAlignChange={handleToolbarAlignChange}
              onBold={handleToolbarBold}
              onItalic={handleToolbarItalic}
              onUnderline={handleToolbarUnderline}
              onBulletList={handleToolbarBulletList}
              onNumberedList={handleToolbarNumberedList}
              onConfirm={handleExitInlineEditing}
              onCancel={handleExitInlineEditing}
            />
          )}

          {/* Rectangle de sélection lasso */}
          {isLassoing && lassoStart && lassoEnd && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-50"
              style={{
                left: `${(Math.min(lassoStart.x, lassoEnd.x) / CANVAS_SCALE.width) * 100}%`,
                top: `${(Math.min(lassoStart.y, lassoEnd.y) / CANVAS_SCALE.height) * 100}%`,
                width: `${(Math.abs(lassoEnd.x - lassoStart.x) / CANVAS_SCALE.width) * 100}%`,
                height: `${(Math.abs(lassoEnd.y - lassoStart.y) / CANVAS_SCALE.height) * 100}%`,
              }}
            />
          )}
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

          {/* Éléments éditables du template - key liée à la version pour forcer le remontage */}
          <React.Fragment key={`elements-${currentVersion?.id}`}>
          {pageContent?.elements
            .filter(e => !e.isDynamic)
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((element) => {
              const style = getElementStyle({ ...element, type: element.type });
              const isSelected = selectedElementIds.includes(element.id);
              const isPrimarySelected = selectedElementId === element.id;
              const isTextElement = element.type === 'text';
              const isShapeElement = element.type === 'shape';
              const isIconElement = element.type === 'icon';
              const textContent = isTextElement ? element.content as TextContent : null;
              const imageContent = element.type === 'image' ? element.content as ImageContent : null;
              const shapeContent = isShapeElement ? element.content as ShapeContent : null;
              const iconContent = isIconElement ? element.content as IconContent : null;
              
              const isDraggedElement = isDragging && isSelected;
              const isResizingElement = isResizing && selectedElementId === element.id;
              
              // Rendu du texte avec support du contenu HTML enrichi
              const renderTextContent = () => {
                if (!textContent) return null;
                
                const listType = textContent.listType || 'none';
                const indentLevel = textContent.indentLevel || 0;
                const indentPx = indentLevel * 12;
                
                // Si contenu HTML enrichi, l'utiliser directement avec une key stable et sanitization
                if (textContent.htmlContent) {
                  return (
                    <div 
                      key={`html-${element.id}-${textContent.htmlContent?.length || 0}`}
                      style={{ paddingLeft: `${indentPx}px` }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(textContent.htmlContent) }}
                    />
                  );
                }
                
                // Fallback sur le texte brut avec support des listes
                const text = textContent.text || '';
                const lines = text.split('\n');
                return (
                  <React.Fragment key={`text-${element.id}`}>
                    {lines.map((line, i) => (
                      <div key={`line-${element.id}-${i}`} style={{ paddingLeft: `${indentPx}px` }}>
                        {listType === 'bullet' && '• '}
                        {listType === 'numbered' && `${i + 1}. `}
                        {line || '\u00A0'}
                      </div>
                    ))}
                  </React.Fragment>
                );
              };

              // Rendu des formes
              const renderShape = () => {
                if (!shapeContent) return null;
                
                const shapeStyle: React.CSSProperties = {
                  width: '100%',
                  height: '100%',
                  backgroundColor: shapeContent.backgroundColor === 'transparent' ? 'transparent' : shapeContent.backgroundColor,
                  opacity: shapeContent.backgroundOpacity / 100,
                  transform: shapeContent.rotation ? `rotate(${shapeContent.rotation}deg)` : undefined,
                  ...(shapeContent.border.enabled && {
                    border: `${shapeContent.border.width}px solid ${shapeContent.border.color}`
                  }),
                  borderRadius: shapeContent.shapeType === 'circle' || shapeContent.shapeType === 'ellipse' 
                    ? '50%' 
                    : shapeContent.cornerRadius,
                };

                if (shapeContent.shapeType === 'line' || shapeContent.shapeType === 'line-vertical') {
                  const isVertical = shapeContent.shapeType === 'line-vertical';
                  const lineStyle = shapeContent.lineStyle || 'solid';
                  const lineWidth = shapeContent.border.width || 2;
                  const lineColor = shapeContent.border.color || '#1f2937';
                  
                  return (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ 
                        transform: shapeContent.rotation ? `rotate(${shapeContent.rotation}deg)` : undefined 
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
                  );
                }

                return (
                  <div style={shapeStyle} className="relative">
                    {shapeContent.innerContent?.text && (
                      <div 
                        className="absolute inset-0 flex"
                        style={{
                          padding: shapeContent.innerContent.padding,
                          justifyContent: { left: 'flex-start', center: 'center', right: 'flex-end' }[shapeContent.innerContent.alignment.horizontal],
                          alignItems: { top: 'flex-start', center: 'center', bottom: 'flex-end' }[shapeContent.innerContent.alignment.vertical]
                        }}
                      >
                        <span style={{ 
                          fontSize: `${shapeContent.innerContent.text.fontSize * 0.4}px`,
                          color: shapeContent.innerContent.text.color,
                          fontWeight: shapeContent.innerContent.text.bold ? 'bold' : 'normal'
                        }}>
                          {shapeContent.innerContent.text.content}
                        </span>
                      </div>
                    )}
                  </div>
                );
              };

              // Rendu des icônes
              const renderIcon = () => {
                if (!iconContent) return null;
                
                const IconComponent = (icons as Record<string, LucideIcon>)[iconContent.iconName];
                if (!IconComponent) {
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30 rounded">
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                }

                return (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ transform: iconContent.rotation ? `rotate(${iconContent.rotation}deg)` : undefined }}
                  >
                    <IconComponent 
                      size={iconContent.size * 0.6}
                      color={iconContent.color}
                      strokeWidth={iconContent.strokeWidth}
                    />
                  </div>
                );
              };
              return (
                <div
                  key={`${currentVersion?.id}-${element.id}`}
                  data-element-id={element.id}
                  ref={inlineEditingElementId === element.id ? editingElementRef : undefined}
                  className={cn(
                    "absolute rounded-sm",
                    !isDragging && !isResizing && "transition-all duration-150",
                    isEditable && !element.isDynamic && !(shapeContent?.isLocked) && !isInlineEditing ? "cursor-grab" : "cursor-pointer",
                    isDraggedElement && "cursor-grabbing opacity-80 shadow-lg scale-[1.02]",
                    isResizingElement && "ring-2 ring-primary",
                    isSelected 
                      ? isPrimarySelected 
                        ? "ring-2 ring-primary bg-primary/10" 
                        : "ring-1 ring-primary/70 bg-primary/5"
                      : "hover:bg-primary/5 hover:ring-1 hover:ring-primary/50",
                  )}
                  style={{
                    ...style,
                    zIndex: (element.zIndex || 0) + 10 + ((isDraggedElement || isResizingElement) ? 1000 : 0)
                  }}
                  onMouseDown={(e) => !isInlineEditing && handleMouseDown(element.id, e)}
                  onClick={(e) => handleElementClick(element.id, e)}
                  onDoubleClick={(e) => handleElementDoubleClick(element.id, e)}
                  title={isEditable ? (isTextElement ? "Double-clic pour éditer" : "Glisser pour déplacer") : "Mode lecture seule"}
                >
                  {/* Édition inline du texte - structure stable avec keys uniques */}
                  {isTextElement && textContent && (
                    <div key={`text-container-${element.id}`}>
                      {inlineEditingElementId === element.id ? (
                        <InlineTextEditor
                          key={`inline-editor-${element.id}`}
                          content={textContent}
                          onContentChange={handleInlineContentChange}
                          onExit={handleExitInlineEditing}
                        />
                      ) : (
                        <div 
                          key={`text-display-${element.id}`}
                          className="px-0.5 py-px"
                          style={{
                            fontFamily: ALLOWED_FONTS.find(f => f.name === textContent.fontFamily)?.value || textContent.fontFamily,
                            fontSize: `${Math.max(textContent.fontSize * 0.4, 6)}px`,
                            color: textContent.color,
                            fontWeight: textContent.bold ? 'bold' : 'normal',
                            fontStyle: textContent.italic ? 'italic' : 'normal',
                            textDecoration: textContent.underline ? 'underline' : 'none',
                            lineHeight: 1.2,
                            textAlign: textContent.textAlign || 'left',
                            width: '100%',
                          }}
                        >
                          <div className="whitespace-pre-wrap break-words">{renderTextContent()}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {element.type === 'image' && (() => {
                    const resolvedUrl = resolveImageUrl(imageContent);
                    
                    return (
                      <div 
                        className={cn(
                          "w-full h-full flex items-center justify-center rounded",
                          !resolvedUrl && "bg-gray-50 border border-dashed border-gray-200"
                        )}
                        style={{ opacity: (imageContent?.opacity ?? 100) / 100 }}
                      >
                        {resolvedUrl ? (
                          <img 
                            src={resolvedUrl} 
                            alt={imageContent?.alt || 'Image'} 
                            className={`w-full h-full ${imageContent?.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                            style={{ transform: `rotate(${imageContent?.rotation || 0}deg)` }}
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-gray-300">
                            <ImageIcon className="h-4 w-4" />
                            <span className="text-[8px]">Image</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {isShapeElement && renderShape()}

                  {isIconElement && renderIcon()}

                  {/* Indicateur de sélection */}
                  {isSelected && (
                    <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                      {isTextElement ? <Type className="h-2.5 w-2.5" /> : 
                       isShapeElement ? <Square className="h-2.5 w-2.5" /> :
                       isIconElement ? <Sparkles className="h-2.5 w-2.5" /> :
                       <ImageIcon className="h-2.5 w-2.5" />}
                    </div>
                  )}

                  {/* Poignées de redimensionnement */}
                  {isSelected && isEditable && (
                    <>
                      <div
                        className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-primary border border-white rounded-sm cursor-nw-resize z-30 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(element.id, 'nw', e)}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary border border-white rounded-sm cursor-ne-resize z-30 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(element.id, 'ne', e)}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-primary border border-white rounded-sm cursor-sw-resize z-30 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(element.id, 'sw', e)}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-primary border border-white rounded-sm cursor-se-resize z-30 hover:scale-125 transition-transform"
                        onMouseDown={(e) => handleResizeMouseDown(element.id, 'se', e)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </React.Fragment>
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
        </div>
      </CardContent>
    </Card>
  );
}
