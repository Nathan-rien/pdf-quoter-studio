/**
 * Types contractuels pour le template PDF
 * Structure dynamique avec pages protégées pour les zones dynamiques
 */

// Pages du template (nombre variable)
export type PDFPageNumber = number;

// Pages protégées contenant des zones dynamiques (ne peuvent pas être supprimées)
export const PROTECTED_PAGES = [4, 5, 6] as const;
export type ProtectedPageNumber = typeof PROTECTED_PAGES[number];

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
  totalPages: number; // Nombre variable de pages
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

// Vérifier si une page est protégée
export function isProtectedPage(pageNumber: number): boolean {
  return PROTECTED_PAGES.includes(pageNumber as ProtectedPageNumber);
}
