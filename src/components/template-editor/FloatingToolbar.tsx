/**
 * Barre d'outils flottante pour l'édition inline du texte
 * Positionnée au-dessus de l'élément en cours d'édition
 * Optimisée avec useMemo pour éviter les re-calculs inutiles
 */

import { useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ALLOWED_FONT_SIZES } from "@/lib/template-styles";
import type { TextAlign, AllowedFontSize } from "@/types/template-editor";

interface FloatingToolbarProps {
  position: { x: number; y: number };
  fontSize: AllowedFontSize;
  textAlign: TextAlign;
  onFontSizeChange: (size: AllowedFontSize) => void;
  onAlignChange: (align: TextAlign) => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// Groupes de tailles de police pour une meilleure lisibilité
const FONT_SIZE_GROUPS = {
  small: { label: 'Petit', sizes: [9, 10, 11, 12] },
  medium: { label: 'Moyen', sizes: [14, 16, 18, 20, 24] },
  large: { label: 'Grand', sizes: [28, 32, 36, 42, 48] },
  xlarge: { label: 'Très grand', sizes: [56, 64, 72, 96] },
} as const;

export const FloatingToolbar = memo(function FloatingToolbar({
  position,
  fontSize,
  textAlign,
  onFontSizeChange,
  onAlignChange,
  onBold,
  onItalic,
  onUnderline,
  onBulletList,
  onNumberedList,
  onConfirm,
  onCancel,
}: FloatingToolbarProps) {
  // Mémoriser le style de positionnement
  const toolbarStyle = useMemo(() => ({
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translateX(-50%)',
  }), [position.x, position.y]);

  return (
    <div
      data-floating-toolbar="true"
      className="absolute z-50 rounded-lg bg-popover border shadow-lg p-1.5 max-w-[calc(100%-16px)]"
      style={toolbarStyle}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      {/* Ligne 1 : formatage + listes + alignement */}
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onBold}
          title="Gras (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onItalic}
          title="Italique (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onUnderline}
          title="Souligné (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onBulletList}
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onNumberedList}
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-5 mx-1" />

        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", textAlign === 'left' && "bg-accent")}
          onClick={() => onAlignChange('left')}
          title="Aligner à gauche"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", textAlign === 'center' && "bg-accent")}
          onClick={() => onAlignChange('center')}
          title="Centrer"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", textAlign === 'right' && "bg-accent")}
          onClick={() => onAlignChange('right')}
          title="Aligner à droite"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", textAlign === 'justify' && "bg-accent")}
          onClick={() => onAlignChange('justify')}
          title="Justifier"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>
      </div>

      <Separator className="my-1" />

      {/* Ligne 2 : taille + actions */}
      <div className="flex items-center justify-between gap-2">
        <Select
          value={String(fontSize)}
          onValueChange={(val) => onFontSizeChange(Number(val) as AllowedFontSize)}
        >
          <SelectTrigger className="h-7 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {Object.entries(FONT_SIZE_GROUPS).map(([key, group]) => (
              <SelectGroup key={key}>
                <SelectLabel className="text-xs text-muted-foreground">{group.label}</SelectLabel>
                {group.sizes.filter(size => 
                  (ALLOWED_FONT_SIZES as readonly number[]).includes(size)
                ).map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-xs">
                    {size}px
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onCancel}
            title="Annuler (Échap)"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={onConfirm}
            title="Confirmer (Clic ailleurs)"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
