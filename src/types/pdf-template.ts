/**
 * Types contractuels pour le template PDF
 * Structure figée - 8 pages
 */

// Pages du template (ordre figé)
export type PDFPageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Type de page
export type PDFPageType = 'static' | 'dynamic_partial' | 'dynamic_conditional';

// Type de zone dynamique
export type DynamicZoneType = 'invest_table' | 'options_block' | 'location_block';

// Définition d'une zone dynamique
export interface DynamicZone {
  id: string;
  pageNumber: PDFPageNumber;
  type: DynamicZoneType;
  sourceSheet: string;
  isRequired: boolean; // true = export bloqué si vide
  description: string;
  // Position personnalisable (optionnelle, en pourcentage)
  position?: { top: number; height: number };
}

// Configuration d'une page
export interface PDFPageConfig {
  pageNumber: PDFPageNumber;
  title: string;
  type: PDFPageType;
  dynamicZones: DynamicZone[];
  staticElements: string[]; // Liste des éléments figés
}

// Template complet
export interface PDFTemplateContract {
  id: string;
  name: string;
  version: string;
  totalPages: 8;
  pages: PDFPageConfig[];
  createdAt: Date;
  isActive: boolean;
}

// Résultat de validation d'une page
export interface PageValidationResult {
  pageNumber: PDFPageNumber;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Résultat de validation du template complet
export interface TemplateValidationResult {
  canExport: boolean;
  pageResults: PageValidationResult[];
  blockers: string[];
  warnings: string[];
}
