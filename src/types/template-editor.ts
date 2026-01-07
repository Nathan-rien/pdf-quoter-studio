/**
 * Types pour l'éditeur de template PDF
 * Mode administration strictement séparé du mode devis
 */

import type { PDFPageNumber, DynamicZone } from './pdf-template';

// Statuts de version du template
export type TemplateVersionStatus = 'brouillon' | 'publie' | 'archive';

// Types d'éléments éditables
export type EditableElementType = 'text' | 'image' | 'block';

// Polices autorisées (liste fermée)
export type AllowedFont = 'Garet' | 'DM Sans' | 'Inter' | 'Roboto';

// Tailles autorisées (liste fermée)
export type AllowedFontSize = 9 | 10 | 11 | 12 | 14 | 16 | 18 | 20 | 24 | 28 | 32;

// Contenu texte avec styles
export interface TextContent {
  text: string;
  fontFamily: AllowedFont;
  fontSize: AllowedFontSize;
  color: string; // Depuis palette définie
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

// Contenu image
export interface ImageContent {
  imageUrl: string;
  alt: string;
}

// Contenu bloc (conteneur d'éléments)
export interface BlockContent {
  elements: EditableElement[];
}

// Élément éditable
export interface EditableElement {
  id: string;
  type: EditableElementType;
  pageNumber: PDFPageNumber;
  isDynamic: boolean; // Si true = LECTURE SEULE absolue
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: TextContent | ImageContent | BlockContent;
  dynamicZoneId?: string; // Référence vers la zone dynamique si isDynamic
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
  selectedElementId: string | null;
  selectedDynamicZoneId: string | null;
  selectedPageNumber: PDFPageNumber;
  editorMode: 'view' | 'edit';
  hasUnsavedChanges: boolean;
  addElementMode: 'none' | 'text' | 'image';
}
