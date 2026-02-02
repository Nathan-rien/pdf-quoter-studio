/**
 * Panel de propriétés pour l'élément sélectionné
 * Édition des textes, images et formes (éléments NON dynamiques uniquement)
 */

import { useRef, useCallback } from "react";
import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "./RichTextEditor";
import { ColorPicker } from "./ColorPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  ALLOWED_COLORS, 
  ALLOWED_FONTS, 
  ALLOWED_FONT_SIZES, 
  TEXT_PRESET_STYLES, 
  ALLOWED_ROTATIONS,
  ALLOWED_LINE_ROTATIONS,
  SHAPE_BACKGROUND_COLORS,
  ALLOWED_BORDER_WIDTHS,
  ALLOWED_CORNER_RADII,
  LINE_STYLES
} from "@/lib/template-styles";
import type { TextContent, ImageContent, ShapeContent, TextPresetStyle, ListType, ShapeType, TextAlign, IconContent } from "@/types/template-editor";
import { 
  Type, 
  Image, 
  Bold, 
  Italic, 
  Underline, 
  MousePointer,
  Info,
  AlertCircle,
  Pencil,
  Edit3,
  Eye,
  AlertTriangle,
  Upload,
  Trash2,
  List,
  ListOrdered,
  Minus,
  IndentIncrease,
  IndentDecrease,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Layers,
  Square,
  Circle,
  RectangleHorizontal,
  Copy,
  Lock,
  Unlock,
  Link2,
  Link2Off,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sparkles,
  Maximize
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ElementProperties() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    currentVersion,
    hasUnsavedChanges,
    updateTextContent,
    updateImageContent,
    updateShapeContent,
    updateElementPosition,
    updateElementSize,
    deleteElement,
    duplicateElement,
    toggleAspectRatioLock,
    toggleElementLock,
    updateIconContent,
    createNewVersion,
    getSelectedElement,
    bringToFront,
    sendToBack,
    selectedElementIds,
    getSelectedElements,
    deleteSelectedElements,
    duplicateSelectedElements
  } = useTemplateEditorStore();

  const selectedElement = getSelectedElement();
  const selectedElements = getSelectedElements();
  const isEditable = currentVersion?.status === 'brouillon';
  const isMultiSelect = selectedElementIds.length > 1;

  const textContent = selectedElement?.type === 'text' 
    ? selectedElement.content as TextContent 
    : null;

  const imageContent = selectedElement?.type === 'image'
    ? selectedElement.content as ImageContent
    : null;

  const shapeContent = selectedElement?.type === 'shape'
    ? selectedElement.content as ShapeContent
    : null;

  const iconContent = selectedElement?.type === 'icon'
    ? selectedElement.content as IconContent
    : null;

  // Tous les hooks useCallback AVANT les returns conditionnels
  const handleTextChange = useCallback((updates: Partial<TextContent>) => {
    if (isEditable && textContent && selectedElement) {
      updateTextContent(selectedElement.id, updates);
    }
  }, [isEditable, textContent, updateTextContent, selectedElement]);

  const handleShapeContentChange = useCallback((updates: Partial<ShapeContent>) => {
    if (isEditable && shapeContent && selectedElement) {
      updateShapeContent(selectedElement.id, updates);
    }
  }, [isEditable, shapeContent, updateShapeContent, selectedElement]);

  const handleShapeBorderChange = useCallback((updates: Partial<ShapeContent['border']>) => {
    if (isEditable && shapeContent && selectedElement) {
      updateShapeContent(selectedElement.id, {
        border: { ...shapeContent.border, ...updates }
      });
    }
  }, [isEditable, shapeContent, updateShapeContent, selectedElement]);

  const handleIconColorChange = useCallback((color: string) => {
    if (isEditable && selectedElement) {
      updateIconContent(selectedElement.id, { color });
    }
  }, [isEditable, selectedElement, updateIconContent]);

  const handleTextColorChange = useCallback((color: string) => {
    if (isEditable && selectedElement) {
      handleTextChange({ color });
    }
  }, [isEditable, selectedElement, handleTextChange]);

  const handleShapeBgColorChange = useCallback((color: string) => {
    if (isEditable && selectedElement) {
      handleShapeContentChange({ backgroundColor: color });
    }
  }, [isEditable, selectedElement, handleShapeContentChange]);

  const handleBorderColorChange = useCallback((color: string) => {
    if (isEditable && selectedElement) {
      handleShapeBorderChange({ color });
    }
  }, [isEditable, selectedElement, handleShapeBorderChange]);

  // Panel multi-sélection
  if (isMultiSelect) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-sm flex items-center gap-2 shrink-0">
              <Layers className="h-4 w-4" />
              {selectedElementIds.length} éléments
            </CardTitle>
            <StatusBadge isEditable={isEditable} hasUnsavedChanges={hasUnsavedChanges} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm">
            <p className="font-medium mb-2">Multi-sélection active</p>
            <p className="text-xs text-muted-foreground">
              {selectedElements.filter(e => e.type === 'text').length} texte(s), {' '}
              {selectedElements.filter(e => e.type === 'image').length} image(s), {' '}
              {selectedElements.filter(e => e.type === 'shape').length} forme(s)
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Utilisez les flèches pour déplacer tous les éléments sélectionnés.
            Ctrl+clic pour modifier la sélection.
          </p>

          <Separator />

          {isEditable && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const duplicated = duplicateSelectedElements();
                  if (duplicated.length > 0) {
                    toast.success(`${duplicated.length} élément(s) dupliqué(s)`);
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Dupliquer la sélection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => {
                  const count = deleteSelectedElements();
                  if (count > 0) {
                    toast.success(`${count} élément(s) supprimé(s)`);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la sélection
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!selectedElement) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2 py-2 px-2">
          <div className="flex items-center justify-between gap-1 flex-wrap">
            <CardTitle className="text-xs flex items-center gap-1 shrink-0">
              <MousePointer className="h-3 w-3" />
              Propriétés
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-2 py-2">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="p-2 rounded-full bg-muted mb-2">
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Aucun élément sélectionné
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedElement.isDynamic) {
    return (
      <Card className="h-full border-warning">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-warning">
            <AlertCircle className="h-4 w-4" />
            Zone protégée
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-warning/10 text-sm">
            <p className="font-medium mb-2">Cette zone est en lecture seule.</p>
            <p className="text-muted-foreground text-xs">
              Les zones dynamiques reçoivent leurs données automatiquement depuis les fichiers Excel/CSV importés.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePresetStyleChange = (preset: TextPresetStyle) => {
    if (isEditable && textContent) {
      const presetStyle = TEXT_PRESET_STYLES[preset];
      updateTextContent(selectedElement.id, {
        presetStyle: preset,
        fontSize: presetStyle.fontSize,
        bold: presetStyle.bold,
        italic: presetStyle.italic || false,
        color: presetStyle.color
      });
    }
  };

  const handleListTypeChange = (listType: ListType) => {
    if (isEditable && textContent) {
      updateTextContent(selectedElement.id, { listType });
    }
  };

  const handleIndentChange = (delta: number) => {
    if (isEditable && textContent) {
      const currentIndent = textContent.indentLevel || 0;
      const newIndent = Math.max(0, Math.min(4, currentIndent + delta));
      updateTextContent(selectedElement.id, { indentLevel: newIndent });
    }
  };

  const handleTextAlignChange = (align: TextAlign) => {
    if (isEditable && textContent) {
      updateTextContent(selectedElement.id, { textAlign: align });
    }
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    if (isEditable && selectedElement) {
      updateElementPosition(selectedElement.id, {
        ...selectedElement.position,
        [axis]: value
      });
    }
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
    if (isEditable && selectedElement) {
      updateElementSize(selectedElement.id, {
        ...selectedElement.size,
        [dimension]: value
      });
    }
  };

  const handleCreateDraft = () => {
    const newVersion = createNewVersion();
    if (newVersion) {
      toast.success(`Brouillon v${newVersion.versionNumber} créé. Vous pouvez maintenant modifier.`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isEditable || !selectedElement) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image valide.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      updateImageContent(selectedElement.id, { imageUrl });
      toast.success("Image mise à jour");
    };
    reader.onerror = () => {
      toast.error("Erreur lors de la lecture du fichier");
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageAltChange = (alt: string) => {
    if (isEditable && selectedElement) {
      updateImageContent(selectedElement.id, { alt });
    }
  };

  const handleRotationChange = (rotation: number) => {
    if (isEditable && selectedElement) {
      updateImageContent(selectedElement.id, { rotation });
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (isEditable && selectedElement) {
      updateImageContent(selectedElement.id, { opacity });
    }
  };

  const handleDeleteElement = () => {
    if (isEditable && selectedElement) {
      deleteElement(selectedElement.id);
      toast.success("Élément supprimé");
    }
  };

  const handleDuplicateElement = () => {
    if (isEditable && selectedElement) {
      const duplicated = duplicateElement(selectedElement.id);
      if (duplicated) {
        toast.success("Élément dupliqué");
      }
    }
  };

  const handleBringToFront = () => {
    if (isEditable && selectedElement) {
      bringToFront(selectedElement.id);
      toast.success("Élément mis au premier plan");
    }
  };

  const handleSendToBack = () => {
    if (isEditable && selectedElement) {
      sendToBack(selectedElement.id);
      toast.success("Élément mis en arrière-plan");
    }
  };

  const handleToggleAspectRatio = () => {
    if (isEditable && selectedElement.type === 'shape') {
      toggleAspectRatioLock(selectedElement.id);
    }
  };

  const handleToggleLock = () => {
    if (isEditable && selectedElement.type === 'shape') {
      toggleElementLock(selectedElement.id);
    }
  };

  const getShapeIcon = () => {
    if (!shapeContent) return Square;
    switch (shapeContent.shapeType) {
      case 'circle':
      case 'ellipse':
        return Circle;
      case 'line':
      case 'line-vertical':
        return Minus;
      default:
        return Square;
    }
  };

  const getShapeLabel = () => {
    if (!shapeContent) return 'Forme';
    const labels: Record<ShapeType, string> = {
      rectangle: 'Rectangle',
      square: 'Carré',
      'rounded-rectangle': 'Rectangle arrondi',
      circle: 'Cercle',
      ellipse: 'Ellipse',
      line: 'Ligne horizontale',
      'line-vertical': 'Ligne verticale'
    };
    return labels[shapeContent.shapeType];
  };

  const ShapeIcon = getShapeIcon();

  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2 shrink-0">
            {selectedElement.type === 'text' ? (
              <Type className="h-4 w-4" />
            ) : selectedElement.type === 'shape' ? (
              <ShapeIcon className="h-4 w-4" />
            ) : selectedElement.type === 'icon' ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            <span className="truncate">
              {selectedElement.type === 'text' ? 'Texte' : selectedElement.type === 'shape' ? getShapeLabel() : selectedElement.type === 'icon' ? 'Icône' : 'Image'}
            </span>
            {shapeContent?.isLocked && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </CardTitle>
          <StatusBadge isEditable={isEditable} hasUnsavedChanges={hasUnsavedChanges} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Icon properties */}
        {selectedElement.type === 'icon' && iconContent && (
          <>
            <div className="space-y-2">
              <Label>Icône sélectionnée</Label>
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-medium">{iconContent.iconName}</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Taille ({iconContent.size}px)</Label>
              <Slider
                value={[iconContent.size]}
                onValueChange={([size]) => updateIconContent(selectedElement.id, { size })}
                min={16}
                max={128}
                step={4}
                disabled={!isEditable}
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <ColorPicker
                colors={ALLOWED_COLORS}
                selectedColor={iconContent.color}
                onColorChange={handleIconColorChange}
                disabled={!isEditable}
                columns={8}
                maxHeight={144}
              />
            </div>

            <div className="space-y-2">
              <Label>Épaisseur du trait ({iconContent.strokeWidth})</Label>
              <Slider
                value={[iconContent.strokeWidth]}
                onValueChange={([strokeWidth]) => updateIconContent(selectedElement.id, { strokeWidth })}
                min={1}
                max={4}
                step={0.5}
                disabled={!isEditable}
              />
            </div>

            <Separator />
          </>
        )}

        {selectedElement.type === 'text' && textContent && (
          <>
            {/* Info édition inline */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Double-cliquez sur le texte dans le canvas pour l'éditer
              </p>
            </div>

            <Separator />

            {/* Style prédéfini */}
            <div className="space-y-2">
              <Label>Style prédéfini</Label>
              <div className="grid grid-cols-4 gap-1">
                {(['titre', 'sousTitre', 'texte', 'note'] as TextPresetStyle[]).map((preset) => (
                  <Button
                    key={preset}
                    variant={textContent.presetStyle === preset ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePresetStyleChange(preset)}
                    disabled={!isEditable}
                    className="text-xs"
                  >
                    {preset === 'sousTitre' ? 'S-titre' : preset === 'titre' ? 'Titre' : preset === 'texte' ? 'Texte' : 'Note'}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Listes */}
            <div className="space-y-2">
              <Label>Liste</Label>
              <div className="flex items-center gap-1">
                <Toggle
                  size="sm"
                  pressed={textContent.listType === 'none' || !textContent.listType}
                  onPressedChange={(pressed) => pressed && handleListTypeChange('none')}
                  disabled={!isEditable}
                  aria-label="Aucune liste"
                >
                  <Minus className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={textContent.listType === 'bullet'}
                  onPressedChange={(pressed) => handleListTypeChange(pressed ? 'bullet' : 'none')}
                  disabled={!isEditable}
                  aria-label="Liste à puces"
                >
                  <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={textContent.listType === 'numbered'}
                  onPressedChange={(pressed) => handleListTypeChange(pressed ? 'numbered' : 'none')}
                  disabled={!isEditable}
                  aria-label="Liste numérotée"
                >
                  <ListOrdered className="h-4 w-4" />
                </Toggle>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleIndentChange(-1)}
                  disabled={!isEditable || (textContent.indentLevel || 0) <= 0}
                  aria-label="Diminuer l'indentation"
                  className="h-8 w-8 p-0"
                >
                  <IndentDecrease className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleIndentChange(1)}
                  disabled={!isEditable || (textContent.indentLevel || 0) >= 4}
                  aria-label="Augmenter l'indentation"
                  className="h-8 w-8 p-0"
                >
                  <IndentIncrease className="h-4 w-4" />
                </Button>
              </div>
              {(textContent.listType === 'bullet' || textContent.listType === 'numbered') && (
                <p className="text-xs text-muted-foreground">
                  Indentation : {textContent.indentLevel || 0}
                </p>
              )}
            </div>

            <Separator />

            {/* Styles de texte */}
            <div className="space-y-3">
              <Label>Formatage</Label>
              <div className="flex items-center gap-1">
                <Toggle
                  size="sm"
                  pressed={textContent.bold}
                  onPressedChange={(pressed) => handleTextChange({ bold: pressed })}
                  disabled={!isEditable}
                  aria-label="Gras"
                >
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={textContent.italic}
                  onPressedChange={(pressed) => handleTextChange({ italic: pressed })}
                  disabled={!isEditable}
                  aria-label="Italique"
                >
                  <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={textContent.underline}
                  onPressedChange={(pressed) => handleTextChange({ underline: pressed })}
                  disabled={!isEditable}
                  aria-label="Souligné"
                >
                  <Underline className="h-4 w-4" />
                </Toggle>
              </div>
            </div>

            {/* Alignement du texte */}
            <div className="space-y-2">
              <Label>Alignement</Label>
              <div className="flex items-center gap-1">
                <Toggle
                  size="sm"
                  pressed={textContent.textAlign === 'left' || !textContent.textAlign}
                  onPressedChange={() => handleTextAlignChange('left')}
                  disabled={!isEditable}
                  aria-label="Aligner à gauche"
                >
                  <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={textContent.textAlign === 'center'}
                  onPressedChange={() => handleTextAlignChange('center')}
                  disabled={!isEditable}
                  aria-label="Centrer"
                >
                  <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={textContent.textAlign === 'right'}
                  onPressedChange={() => handleTextAlignChange('right')}
                  disabled={!isEditable}
                  aria-label="Aligner à droite"
                >
                  <AlignRight className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={textContent.textAlign === 'justify'}
                  onPressedChange={() => handleTextAlignChange('justify')}
                  disabled={!isEditable}
                  aria-label="Justifier"
                >
                  <AlignJustify className="h-4 w-4" />
                </Toggle>
              </div>
            </div>

            {/* Police */}
            <div className="space-y-2">
              <Label htmlFor="font-family">Police</Label>
              <Select
                value={textContent.fontFamily}
                onValueChange={(value) => handleTextChange({ fontFamily: value as TextContent['fontFamily'] })}
                disabled={!isEditable}
              >
                <SelectTrigger id="font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_FONTS.map((font) => (
                    <SelectItem key={font.name} value={font.name}>
                      <span style={{ fontFamily: font.value }}>{font.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Taille */}
            <div className="space-y-2">
              <Label htmlFor="font-size">Taille</Label>
              <Select
                value={textContent.fontSize.toString()}
                onValueChange={(value) => handleTextChange({ fontSize: parseInt(value) as TextContent['fontSize'] })}
                disabled={!isEditable}
              >
                <SelectTrigger id="font-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectGroup>
                    <SelectLabel className="text-xs text-muted-foreground">Petit</SelectLabel>
                    {[9, 10, 11, 12].map((size) => (
                      <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs text-muted-foreground">Moyen</SelectLabel>
                    {[14, 16, 18, 20, 24].map((size) => (
                      <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs text-muted-foreground">Grand</SelectLabel>
                    {[28, 32, 36, 42, 48].map((size) => (
                      <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-xs text-muted-foreground">Très grand</SelectLabel>
                    {[56, 64, 72, 96].map((size) => (
                      <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Couleur */}
            <div className="space-y-2">
              <Label>Couleur du texte</Label>
              <ColorPicker
                colors={ALLOWED_COLORS}
                selectedColor={textContent.color}
                onColorChange={handleTextColorChange}
                disabled={!isEditable}
                columns={8}
                maxHeight={160}
              />
            </div>
          </>
        )}

        {selectedElement.type === 'image' && imageContent && (
          <>
            {/* Prévisualisation */}
            <div 
              className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden border"
              style={{
                opacity: (imageContent.opacity ?? 100) / 100
              }}
            >
              {imageContent.imageUrl ? (
                <img 
                  src={imageContent.imageUrl} 
                  alt={imageContent.alt || 'Image'} 
                  className={`w-full h-full ${imageContent.objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                  style={{
                    transform: `rotate(${imageContent.rotation || 0}deg)`
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Image className="h-8 w-8" />
                  <span className="text-xs">Aucune image</span>
                </div>
              )}
            </div>
            
            {/* Input file caché */}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              ref={fileInputRef}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              className="w-full" 
              disabled={!isEditable}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {imageContent.imageUrl ? 'Remplacer l\'image' : 'Ajouter une image'}
            </Button>
            
            {/* Texte alternatif */}
            <div className="space-y-2">
              <Label htmlFor="image-alt">Texte alternatif</Label>
              <Input
                id="image-alt"
                value={imageContent.alt || ''}
                onChange={(e) => handleImageAltChange(e.target.value)}
                disabled={!isEditable}
                placeholder="Description de l'image..."
              />
            </div>
            
            <Separator />
            
            {/* Rotation */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <RotateCw className="h-4 w-4" />
                Rotation
              </Label>
              <div className="flex items-center gap-1">
                {ALLOWED_ROTATIONS.map((rotation) => (
                  <Button
                    key={rotation}
                    variant={(imageContent.rotation || 0) === rotation ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleRotationChange(rotation)}
                    disabled={!isEditable}
                    className="flex-1"
                  >
                    {rotation}°
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Opacité */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Opacité</span>
                <span className="text-xs text-muted-foreground">{imageContent.opacity ?? 100}%</span>
              </Label>
              <Slider
                value={[imageContent.opacity ?? 100]}
                onValueChange={([value]) => handleOpacityChange(value)}
                min={0}
                max={100}
                step={5}
                disabled={!isEditable}
                className="w-full"
              />
            </div>
            
            <Separator />
            
            {/* Mode de remplissage */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Maximize className="h-4 w-4" />
                Remplissage
              </Label>
              <div className="flex items-center gap-1">
                <Button
                  variant={(!imageContent.objectFit || imageContent.objectFit === 'contain') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateImageContent(selectedElementIds[0], { objectFit: 'contain' })}
                  disabled={!isEditable}
                  className="flex-1"
                >
                  Contenir
                </Button>
                <Button
                  variant={imageContent.objectFit === 'cover' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateImageContent(selectedElementIds[0], { objectFit: 'cover' })}
                  disabled={!isEditable}
                  className="flex-1"
                >
                  Remplir
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {imageContent.objectFit === 'cover' 
                  ? 'L\'image remplit le cadre (peut être rognée)' 
                  : 'L\'image est entièrement visible (peut avoir des marges)'}
              </p>
            </div>
            
            <Separator />
            
            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="width">Largeur</Label>
                <Input
                  id="width"
                  type="number"
                  value={selectedElement.size.width}
                  onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 0)}
                  disabled={!isEditable}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Hauteur</Label>
                <Input
                  id="height"
                  type="number"
                  value={selectedElement.size.height}
                  onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 0)}
                  disabled={!isEditable}
                />
              </div>
            </div>
          </>
        )}

        {/* === SECTION FORMES === */}
        {selectedElement.type === 'shape' && shapeContent && (
          <>
            {shapeContent.isLocked && (
              <div className="p-3 rounded-lg bg-warning/10 text-sm">
                <p className="font-medium text-warning flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Forme verrouillée
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Déverrouillez la forme pour la modifier.
                </p>
              </div>
            )}

            {/* Couleur de fond */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Couleur de fond
              </Label>
              <ColorPicker
                colors={SHAPE_BACKGROUND_COLORS}
                selectedColor={shapeContent.backgroundColor}
                onColorChange={handleShapeBgColorChange}
                disabled={!isEditable || shapeContent.isLocked}
                columns={8}
                maxHeight={180}
              />
            </div>

            {/* Opacité du fond */}
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Opacité du fond</span>
                <span className="text-xs text-muted-foreground">{shapeContent.backgroundOpacity}%</span>
              </Label>
              <Slider
                value={[shapeContent.backgroundOpacity]}
                onValueChange={([value]) => handleShapeContentChange({ backgroundOpacity: value })}
                min={0}
                max={100}
                step={5}
                disabled={!isEditable || shapeContent.isLocked}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Bordure */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  Bordure
                </Label>
                <Switch
                  checked={shapeContent.border.enabled}
                  onCheckedChange={(checked) => handleShapeBorderChange({ enabled: checked })}
                  disabled={!isEditable || shapeContent.isLocked}
                />
              </div>

              {shapeContent.border.enabled && (
                <>
                  {/* Couleur de bordure */}
                  <div className="space-y-2">
                    <Label className="text-xs">Couleur</Label>
                    <ColorPicker
                      colors={ALLOWED_COLORS}
                      selectedColor={shapeContent.border.color}
                      onColorChange={handleBorderColorChange}
                      disabled={!isEditable || shapeContent.isLocked}
                      columns={8}
                      size="sm"
                      maxHeight={120}
                    />
                  </div>

                  {/* Épaisseur de bordure */}
                  <div className="space-y-2">
                    <Label className="text-xs">Épaisseur</Label>
                    <div className="flex items-center gap-1">
                      {ALLOWED_BORDER_WIDTHS.map((width) => (
                        <Button
                          key={width}
                          variant={shapeContent.border.width === width ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleShapeBorderChange({ width })}
                          disabled={!isEditable || shapeContent.isLocked}
                          className="flex-1 text-xs"
                        >
                          {width}px
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Section spéciale pour les lignes */}
            {(shapeContent.shapeType === 'line' || shapeContent.shapeType === 'line-vertical') && (
              <>
                <Separator />
                
                {/* Épaisseur du trait */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Épaisseur du trait
                  </Label>
                  <div className="flex items-center gap-1">
                    {ALLOWED_BORDER_WIDTHS.map((width) => (
                      <Button
                        key={width}
                        variant={shapeContent.border.width === width ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleShapeBorderChange({ width })}
                        disabled={!isEditable || shapeContent.isLocked}
                        className="flex-1 text-xs"
                      >
                        {width}px
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Couleur du trait */}
                <div className="space-y-2">
                  <Label className="text-xs">Couleur du trait</Label>
                  <ColorPicker
                    colors={ALLOWED_COLORS}
                    selectedColor={shapeContent.border.color}
                    onColorChange={handleBorderColorChange}
                    disabled={!isEditable || shapeContent.isLocked}
                    columns={8}
                    size="sm"
                    maxHeight={120}
                  />
                </div>

                {/* Rotation de la ligne */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4" />
                    Rotation
                  </Label>
                  <div className="flex items-center gap-1">
                    {ALLOWED_LINE_ROTATIONS.map((rotation) => (
                      <Button
                        key={rotation}
                        variant={shapeContent.rotation === rotation ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleShapeContentChange({ rotation })}
                        disabled={!isEditable || shapeContent.isLocked}
                        className="flex-1 text-xs"
                      >
                        {rotation}°
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Style de ligne */}
                <div className="space-y-2">
                  <Label>Style de trait</Label>
                  <div className="flex items-center gap-1">
                    {LINE_STYLES.map((style) => (
                      <Button
                        key={style.value}
                        variant={(shapeContent.lineStyle || 'solid') === style.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleShapeContentChange({ lineStyle: style.value })}
                        disabled={!isEditable || shapeContent.isLocked}
                        className="flex-1 text-xs"
                      >
                        {style.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Coins arrondis (sauf cercle, ellipse, lignes) */}
            {!['circle', 'ellipse', 'line', 'line-vertical'].includes(shapeContent.shapeType) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>Coins arrondis</span>
                    <span className="text-xs text-muted-foreground">{shapeContent.cornerRadius}px</span>
                  </Label>
                  <div className="flex items-center gap-1 flex-wrap">
                    {ALLOWED_CORNER_RADII.map((radius) => (
                      <Button
                        key={radius}
                        variant={shapeContent.cornerRadius === radius ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleShapeContentChange({ cornerRadius: radius })}
                        disabled={!isEditable || shapeContent.isLocked}
                        className="text-xs h-7 px-2"
                      >
                        {radius}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Rotation (sauf lignes - elles ont leur propre section) */}
            {!['line', 'line-vertical'].includes(shapeContent.shapeType) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <RotateCw className="h-4 w-4" />
                    Rotation
                  </Label>
                  <div className="flex items-center gap-1">
                    {ALLOWED_ROTATIONS.map((rotation) => (
                      <Button
                        key={rotation}
                        variant={shapeContent.rotation === rotation ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleShapeContentChange({ rotation })}
                        disabled={!isEditable || shapeContent.isLocked}
                        className="flex-1"
                      >
                        {rotation}°
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Dimensions avec verrouillage ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Dimensions</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleAspectRatio}
                  disabled={!isEditable || shapeContent.isLocked}
                  className="h-6 px-2 gap-1"
                  title={shapeContent.aspectRatioLocked ? "Déverrouiller le ratio" : "Verrouiller le ratio"}
                >
                  {shapeContent.aspectRatioLocked ? (
                    <Link2 className="h-3 w-3" />
                  ) : (
                    <Link2Off className="h-3 w-3" />
                  )}
                  <span className="text-xs">{shapeContent.aspectRatioLocked ? 'Lié' : 'Libre'}</span>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="shape-width" className="text-xs">Largeur</Label>
                  <Input
                    id="shape-width"
                    type="number"
                    value={selectedElement.size.width}
                    onChange={(e) => handleSizeChange('width', parseInt(e.target.value) || 0)}
                    disabled={!isEditable || shapeContent.isLocked}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="shape-height" className="text-xs">Hauteur</Label>
                  <Input
                    id="shape-height"
                    type="number"
                    value={selectedElement.size.height}
                    onChange={(e) => handleSizeChange('height', parseInt(e.target.value) || 0)}
                    disabled={!isEditable || shapeContent.isLocked}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions forme */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Actions</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDuplicateElement}
                  disabled={!isEditable}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Dupliquer
                </Button>
                <Button
                  variant={shapeContent.isLocked ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleLock}
                  disabled={!isEditable}
                  className="flex-1"
                >
                  {shapeContent.isLocked ? (
                    <>
                      <Lock className="h-4 w-4 mr-1" />
                      Verrouillée
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-1" />
                      Verrouiller
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Position</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pos-x" className="text-xs">X</Label>
              <Input
                id="pos-x"
                type="number"
                value={selectedElement.position.x}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                disabled={!isEditable}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pos-y" className="text-xs">Y</Label>
              <Input
                id="pos-y"
                type="number"
                value={selectedElement.position.y}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                disabled={!isEditable}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Calques */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            Calques
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendToBack}
              disabled={!isEditable}
              className="flex-1"
            >
              <ArrowDown className="h-4 w-4 mr-1" />
              Arrière
            </Button>
            <Badge variant="secondary" className="px-3">
              {selectedElement.zIndex || 0}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBringToFront}
              disabled={!isEditable}
              className="flex-1"
            >
              <ArrowUp className="h-4 w-4 mr-1" />
              Avant
            </Button>
          </div>
        </div>

        {/* Bouton supprimer */}
        {isEditable && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={handleDeleteElement}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer l'élément
          </Button>
        )}

        {!isEditable && (
          <div className="p-3 rounded-lg bg-muted space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              Mode lecture seule. Créez un brouillon pour modifier.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleCreateDraft}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Créer un brouillon pour éditer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant de badge de statut
function StatusBadge({ isEditable, hasUnsavedChanges }: { isEditable: boolean; hasUnsavedChanges: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {hasUnsavedChanges && (
        <Badge variant="warning" className="gap-1 text-xs">
          <AlertTriangle className="h-3 w-3" />
          Non sauvegardé
        </Badge>
      )}
      <Badge variant={isEditable ? 'success' : 'secondary'} className="gap-1 text-xs">
        {isEditable ? <Edit3 className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        {isEditable ? 'Édition' : 'Lecture seule'}
      </Badge>
    </div>
  );
}