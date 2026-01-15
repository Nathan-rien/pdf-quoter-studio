/**
 * Types pour l'éditeur de template PDF
 * Mode administration strictement séparé du mode devis
 */

import type { PDFPageNumber, DynamicZone } from './pdf-template';

// Statuts de version du template
export type TemplateVersionStatus = 'brouillon' | 'publie' | 'archive';

// Types d'éléments éditables
export type EditableElementType = 'text' | 'image' | 'block' | 'shape' | 'group' | 'icon';

// Types de formes disponibles
export type ShapeType = 'rectangle' | 'square' | 'rounded-rectangle' | 'circle' | 'ellipse' | 'line' | 'line-vertical';

// Style de trait pour les lignes
export type LineStyle = 'solid' | 'dashed' | 'dotted';

// Polices autorisées (liste fermée)
export type AllowedFont = 'Garet' | 'DM Sans' | 'Inter' | 'Roboto';

// Tailles autorisées (liste fermée)
export type AllowedFontSize = 9 | 10 | 11 | 12 | 14 | 16 | 18 | 20 | 24 | 28 | 32 | 36 | 42 | 48 | 56 | 64 | 72 | 96;

// Type de liste
export type ListType = 'none' | 'bullet' | 'numbered';

// Type d'alignement de texte
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// Styles prédéfinis
export type TextPresetStyle = 'titre' | 'sousTitre' | 'texte' | 'note';

// Contenu texte avec styles
export interface TextContent {
  text: string;
  htmlContent?: string; // Contenu HTML enrichi pour mise en forme partielle
  fontFamily: AllowedFont;
  fontSize: AllowedFontSize;
  color: string; // Depuis palette définie
  bold: boolean;
  italic: boolean;
  underline: boolean;
  // Nouveaux champs pour les listes et styles prédéfinis
  listType?: ListType;
  indentLevel?: number; // 0-4 niveaux d'indentation
  presetStyle?: TextPresetStyle;
  textAlign?: TextAlign; // Alignement du texte (défaut: 'left')
}

// Contenu image
export interface ImageContent {
  imageUrl: string;
  alt: string;
  // Nouveaux champs pour rotation et opacité
  rotation?: number; // 0, 90, 180, 270 degrés
  opacity?: number; // 0-100%
  objectFit?: 'contain' | 'cover'; // Mode de remplissage (défaut: 'contain')
}

// Contenu bloc (conteneur d'éléments)
export interface BlockContent {
  elements: EditableElement[];
}

// Style de bordure pour les formes
export interface ShapeBorderStyle {
  enabled: boolean;
  color: string;
  width: number; // 1-10px
}

// Contenu texte interne d'une forme
export interface ShapeInnerText {
  content: string;
  fontSize: AllowedFontSize;
  color: string;
  fontFamily: AllowedFont;
  bold: boolean;
  italic: boolean;
}

// Contenu icône interne d'une forme
export interface ShapeInnerIcon {
  name: string; // Nom de l'icône Lucide
  size: number;
  color: string;
}

// Contenu interne d'une forme
export interface ShapeInnerContent {
  text?: ShapeInnerText;
  icon?: ShapeInnerIcon;
  alignment: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  padding: number; // Marges internes 0-32px
}

// Contenu d'une forme
export interface ShapeContent {
  shapeType: ShapeType;
  backgroundColor: string;
  backgroundOpacity: number; // 0-100%
  border: ShapeBorderStyle;
  cornerRadius: number; // 0-50px (0 = angles droits)
  rotation: number; // 0, 45, 90, 135, 180 (étendu pour les lignes)
  innerContent?: ShapeInnerContent;
  aspectRatioLocked: boolean;
  isLocked: boolean; // Forme verrouillée (non modifiable)
  lineStyle?: LineStyle; // Style de trait pour les lignes (solid, dashed, dotted)
}

// Groupe d'éléments
export interface GroupContent {
  elementIds: string[]; // IDs des éléments groupés
}

// Contenu icône (nouvel élément)
export interface IconContent {
  iconName: string;  // Nom de l'icône Lucide (PascalCase)
  size: number;      // 16-128px
  color: string;     // Couleur depuis palette
  strokeWidth: number; // 1-4
  rotation: number;  // 0, 90, 180, 270
}

// Élément éditable
export interface EditableElement {
  id: string;
  type: EditableElementType;
  pageNumber: PDFPageNumber;
  isDynamic: boolean; // Si true = LECTURE SEULE absolue
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: TextContent | ImageContent | BlockContent | ShapeContent | GroupContent | IconContent;
  dynamicZoneId?: string; // Référence vers la zone dynamique si isDynamic
  zIndex?: number; // Ordre d'empilement (0 = fond, plus haut = devant)
}

// Contenu d'une page du template
export interface TemplatePageContent {
  pageNumber: PDFPageNumber;
  elements: EditableElement[];
  dynamicZones: DynamicZone[]; // Zones protégées - lecture seule
}

// Version de template
export interface TemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  status: TemplateVersionStatus;
  createdAt: Date;
  createdBy: string;
  publishedAt: Date | null;
  pages: TemplatePageContent[];
  dynamicZonesIntact: boolean; // Validé avant publication
}

// Template PDF (collection de versions)
export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  isActive: boolean; // Un seul template peut être actif à la fois
}

// Résultat de validation pour publication
export interface PublishValidationResult {
  canPublish: boolean;
  errors: PublishValidationError[];
  warnings: PublishValidationWarning[];
}

export interface PublishValidationError {
  type: 'dynamic_zone_integrity' | 'page_count' | 'page_order' | 'missing_zone';
  pageNumber?: PDFPageNumber;
  zoneId?: string;
  message: string;
}

export interface PublishValidationWarning {
  type: 'empty_text' | 'missing_image';
  pageNumber?: PDFPageNumber;
  elementId?: string;
  message: string;
}

// État de l'éditeur
export interface TemplateEditorState {
  // Gestion des templates
  allTemplates: PDFTemplate[];
  currentTemplateId: string | null;
  viewMode: 'list' | 'editor';
  
  // Versions du template courant
  currentVersion: TemplateVersion | null;
  allVersions: TemplateVersion[];
  selectedElementId: string | null; // Élément principal sélectionné (pour compatibilité)
  selectedElementIds: string[]; // Multi-sélection
  selectedDynamicZoneId: string | null;
  selectedPageNumber: PDFPageNumber;
  editorMode: 'view' | 'edit';
  hasUnsavedChanges: boolean;
  addElementMode: 'none' | 'text' | 'image' | 'shape' | 'icon';
  selectedShapeType: ShapeType | null;
  selectedIconName: string | null;
  inlineEditingElementId: string | null; // Élément en cours d'édition inline
}
