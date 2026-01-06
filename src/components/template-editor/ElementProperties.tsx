/**
 * Panel de propriétés pour l'élément sélectionné
 * Édition des textes et images (éléments NON dynamiques uniquement)
 */

import { useTemplateEditorStore } from "@/stores/templateEditorStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ALLOWED_COLORS, ALLOWED_FONTS, ALLOWED_FONT_SIZES } from "@/lib/template-styles";
import type { TextContent } from "@/types/template-editor";
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
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ElementProperties() {
  const { 
    currentVersion,
    hasUnsavedChanges,
    updateTextContent,
    updateElementPosition,
    updateElementSize,
    createNewVersion,
    getSelectedElement
  } = useTemplateEditorStore();

  const selectedElement = getSelectedElement();
  const isEditable = currentVersion?.status === 'brouillon';

  if (!selectedElement) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MousePointer className="h-4 w-4" />
              Propriétés
            </CardTitle>
            <StatusBadge isEditable={isEditable} hasUnsavedChanges={hasUnsavedChanges} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Info className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Aucun élément sélectionné
            </p>
            <p className="text-xs text-muted-foreground">
              Cliquez sur un élément éditable dans le canvas pour modifier ses propriétés.
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

  const textContent = selectedElement.type === 'text' 
    ? selectedElement.content as TextContent 
    : null;

  const handleTextChange = (updates: Partial<TextContent>) => {
    if (isEditable && textContent) {
      updateTextContent(selectedElement.id, updates);
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

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {selectedElement.type === 'text' ? (
              <Type className="h-4 w-4" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            Propriétés - {selectedElement.type === 'text' ? 'Texte' : 'Image'}
          </CardTitle>
          <StatusBadge isEditable={isEditable} hasUnsavedChanges={hasUnsavedChanges} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedElement.type === 'text' && textContent && (
          <>
            {/* Contenu texte */}
            <div className="space-y-2">
              <Label htmlFor="text-content">Texte</Label>
              <Textarea
                id="text-content"
                value={textContent.text}
                onChange={(e) => handleTextChange({ text: e.target.value })}
                disabled={!isEditable}
                className="min-h-[80px]"
                placeholder="Saisissez le texte..."
              />
            </div>

            <Separator />

            {/* Styles de texte */}
            <div className="space-y-3">
              <Label>Style</Label>
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
                <SelectContent>
                  {ALLOWED_FONT_SIZES.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Couleur */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="grid grid-cols-7 gap-1">
                {ALLOWED_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-6 h-6 rounded border-2 transition-all",
                      textContent.color === color.value 
                        ? "border-primary ring-2 ring-primary/30" 
                        : "border-transparent hover:border-muted-foreground/50",
                      !isEditable && "opacity-50 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleTextChange({ color: color.value })}
                    disabled={!isEditable}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {selectedElement.type === 'image' && (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
              <Image className="h-8 w-8 text-muted-foreground" />
            </div>
            <Button variant="outline" className="w-full" disabled={!isEditable}>
              Remplacer l'image
            </Button>
            
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
          </div>
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
