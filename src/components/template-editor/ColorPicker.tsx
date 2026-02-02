/**
 * Composant ColorPicker réutilisable et optimisé
 * Utilisé pour la sélection de couleurs dans l'éditeur de template
 */

import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Pattern SVG pour la transparence (damier)
const TRANSPARENT_PATTERN = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOCIgaGVpZ2h0PSI4IiB2aWV3Qm94PSIwIDAgOCA4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjY2NjIi8+PC9zdmc+')";

export interface ColorDefinition {
  readonly name: string;
  readonly value: string;
  readonly category: string;
}

export interface ColorPickerProps {
  /** Liste des couleurs disponibles */
  colors: readonly ColorDefinition[];
  /** Couleur actuellement sélectionnée */
  selectedColor: string;
  /** Callback appelé lors du changement de couleur */
  onColorChange: (color: string) => void;
  /** Désactive le picker */
  disabled?: boolean;
  /** Nombre de colonnes (8, 9 ou 10) */
  columns?: 8 | 9 | 10;
  /** Taille des pastilles ('sm' = 16px, 'md' = 20px) */
  size?: 'sm' | 'md';
  /** Hauteur maximale avant scroll */
  maxHeight?: number;
  /** Afficher les tooltips avec nom et code hex */
  showTooltips?: boolean;
}

// Labels français pour les catégories
const CATEGORY_LABELS: Record<string, string> = {
  special: 'Spécial',
  neutral: 'Neutres',
  blue: 'Bleus',
  green: 'Verts',
  yellow: 'Jaunes/Orange',
  red: 'Rouges',
  purple: 'Violets/Roses',
  other: 'Autres',
};

/**
 * Composant pastille de couleur individuelle
 */
const ColorSwatch = React.memo(function ColorSwatch({
  color,
  isSelected,
  disabled,
  size,
  showTooltip,
  onClick,
}: {
  color: ColorDefinition;
  isSelected: boolean;
  disabled: boolean;
  size: 'sm' | 'md';
  showTooltip: boolean;
  onClick: () => void;
}) {
  const isTransparent = color.value === 'transparent';
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  const button = (
    <button
      type="button"
      className={cn(
        sizeClass,
        "rounded border-2 transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/50",
        isSelected 
          ? "border-primary ring-2 ring-primary/30 scale-110 z-10" 
          : "border-transparent hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{ 
        backgroundColor: isTransparent ? undefined : color.value,
        backgroundImage: isTransparent ? TRANSPARENT_PATTERN : undefined,
      }}
      onClick={onClick}
      disabled={disabled}
      title={showTooltip ? undefined : `${color.name} (${color.value})`}
      aria-label={`Sélectionner ${color.name}`}
    />
  );

  if (showTooltip) {
    return (
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <span className="font-medium">{color.name}</span>
          <span className="text-muted-foreground ml-1">({color.value})</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
});

/**
 * ColorPicker optimisé avec mémoisation et groupement par catégorie
 */
export const ColorPicker = React.memo(function ColorPicker({
  colors,
  selectedColor,
  onColorChange,
  disabled = false,
  columns = 8,
  size = 'md',
  maxHeight = 144,
  showTooltips = true,
}: ColorPickerProps) {
  // Grouper les couleurs par catégorie (mémorisé)
  const groupedColors = useMemo(() => {
    const groups: Record<string, ColorDefinition[]> = {};
    
    colors.forEach((color) => {
      if (!groups[color.category]) {
        groups[color.category] = [];
      }
      groups[color.category].push(color);
    });
    
    return groups;
  }, [colors]);

  // Ordre des catégories
  const categoryOrder = useMemo(() => {
    const order = ['special', 'neutral', 'blue', 'green', 'yellow', 'red', 'purple', 'other'];
    return order.filter(cat => groupedColors[cat]?.length > 0);
  }, [groupedColors]);

  // Handler mémorisé
  const handleColorClick = useCallback((value: string) => {
    if (!disabled) {
      onColorChange(value);
    }
  }, [disabled, onColorChange]);

  const gridColsClass = columns === 10 ? 'grid-cols-10' : columns === 9 ? 'grid-cols-9' : 'grid-cols-8';

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "overflow-y-auto p-1.5 border rounded-md bg-muted/20",
          "will-change-scroll"
        )}
        style={{ maxHeight }}
      >
        <div className={cn("grid gap-1", gridColsClass)}>
          {categoryOrder.map((category) => (
            <React.Fragment key={category}>
              {groupedColors[category]?.map((color) => (
                <ColorSwatch
                  key={color.value}
                  color={color}
                  isSelected={selectedColor === color.value}
                  disabled={disabled}
                  size={size}
                  showTooltip={showTooltips}
                  onClick={() => handleColorClick(color.value)}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
});

export default ColorPicker;
