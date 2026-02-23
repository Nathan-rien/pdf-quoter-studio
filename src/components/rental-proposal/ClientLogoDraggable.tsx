/**
 * Logo client déplaçable et redimensionnable en mode Modifier
 * Utilise le même pattern de drag/resize que PreviewEditableCanvas
 */

import React, { useState, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Move, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClientLogoOverride } from '@/stores/rentalProposalStore';

interface ClientLogoDraggableProps {
  logoUrl: string;
  topPct: number;
  leftPct: number;
  width?: number;
  height: number;
  useTranslateX: boolean;
  isEditMode: boolean;
  onUpdate: (override: ClientLogoOverride) => void;
  onReset: () => void;
  hasOverride: boolean;
}

export function ClientLogoDraggable({
  logoUrl,
  topPct,
  leftPct,
  width,
  height,
  useTranslateX,
  isEditMode,
  onUpdate,
  onReset,
  hasOverride,
}: ClientLogoDraggableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; top: number; left: number } | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; width: number; height: number; corner: string } | null>(null);

  const getParentRect = useCallback(() => {
    return containerRef.current?.parentElement?.getBoundingClientRect() || null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      top: topPct,
      left: leftPct,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragStartRef.current) return;
      const parentRect = getParentRect();
      if (!parentRect) return;
      const deltaXPct = ((ev.clientX - dragStartRef.current.mouseX) / parentRect.width) * 100;
      const deltaYPct = ((ev.clientY - dragStartRef.current.mouseY) / parentRect.height) * 100;
      onUpdate({
        top: Math.max(0, Math.min(95, dragStartRef.current.top + deltaYPct)),
        left: Math.max(0, Math.min(95, dragStartRef.current.left + deltaXPct)),
        width: width || 0,
        height,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditMode, topPct, leftPct, width, height, onUpdate, getParentRect]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, corner: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: width || 80,
      height,
      corner,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const deltaX = ev.clientX - resizeStartRef.current.mouseX;
      const deltaY = ev.clientY - resizeStartRef.current.mouseY;
      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      if (corner.includes('e')) newWidth = Math.max(20, resizeStartRef.current.width + deltaX);
      if (corner.includes('w')) newWidth = Math.max(20, resizeStartRef.current.width - deltaX);
      if (corner.includes('s')) newHeight = Math.max(15, resizeStartRef.current.height + deltaY);
      if (corner.includes('n')) newHeight = Math.max(15, resizeStartRef.current.height - deltaY);

      onUpdate({ top: topPct, left: leftPct, width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [isEditMode, width, height, topPct, leftPct, onUpdate]);

  const resizeCorners = ['nw', 'ne', 'sw', 'se'] as const;

  // Mode lecture : rendu simple
  if (!isEditMode) {
    return (
      <div
        className="absolute z-40"
        style={{
          top: `${topPct}%`,
          left: `${leftPct}%`,
          transform: useTranslateX ? 'translateX(-50%)' : undefined,
        }}
      >
        <img
          src={logoUrl}
          alt="Logo client"
          style={{
            width: width ? `${width}px` : undefined,
            height: `${height}px`,
            objectFit: 'contain',
          }}
        />
      </div>
    );
  }

  // Mode édition : interactif
  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute z-40 group",
        "cursor-move",
        (isHovered || isDragging || isResizing) && "ring-2 ring-primary ring-offset-1 rounded",
      )}
      style={{
        top: `${topPct}%`,
        left: `${leftPct}%`,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isDragging && !isResizing && setIsHovered(false)}
    >
      {/* Badge déplacer */}
      {(isHovered || isDragging) && (
        <Badge
          variant="secondary"
          className="absolute -top-5 left-0 z-50 gap-1 text-[8px] py-0 px-1.5 whitespace-nowrap"
        >
          <Move className="h-2.5 w-2.5" />
          Logo client
        </Badge>
      )}

      {/* Bouton reset */}
      {hasOverride && isHovered && !isDragging && (
        <button
          className="absolute -top-5 right-0 z-50 bg-destructive text-destructive-foreground rounded px-1 py-0 text-[8px] flex items-center gap-0.5 hover:bg-destructive/90"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
        >
          <RotateCcw className="h-2.5 w-2.5" />
          Reset
        </button>
      )}

      <img
        src={logoUrl}
        alt="Logo client"
        style={{
          width: width ? `${width}px` : undefined,
          height: `${height}px`,
          objectFit: 'contain',
        }}
        draggable={false}
      />

      {/* Poignées de resize */}
      {(isHovered || isDragging || isResizing) && resizeCorners.map(corner => (
        <div
          key={corner}
          className={cn(
            "absolute w-2 h-2 bg-primary rounded-full z-50",
            corner === 'nw' && 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize',
            corner === 'ne' && 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize',
            corner === 'sw' && 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize',
            corner === 'se' && 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize',
          )}
          onMouseDown={(e) => handleResizeMouseDown(e, corner)}
        />
      ))}
    </div>
  );
}
