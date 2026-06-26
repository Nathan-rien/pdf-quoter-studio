/**
 * Types contractuels pour le template PDF
 * Structure dynamique avec pages protégées pour les zones dynamiques
 */

// Pages du template (nombre variable)
export type PDFPageNumber = number;

// Type de page
export type PDFPageType = 'static' | 'dynamic_partial' | 'dynamic_conditional';

// Type de zone dynamique
export type DynamicZoneType =
  | 'invest_table'
  | 'options_block'
  | 'location_block'
  | 'service_client_info'
  | 'service_invest_table'
  | 'service_conditions'
  | 'service_signature';

// Types de zone disponibles avec leurs métadonnées
export const AVAILABLE_ZONE_TYPES: { type: DynamicZoneType; label: string; sourceSheet: string; description: string }[] = [
  { type: 'invest_table', label: 'Tableau Invest', sourceSheet: 'invest ', description: 'Tableau des produits/matériels' },
  { type: 'options_block', label: 'Bloc Options', sourceSheet: 'Options services ', description: 'Bloc services et options' },
  { type: 'location_block', label: 'Bloc Location', sourceSheet: 'invest ', description: 'Bloc conditions de location (durée, montant, loyer)' },
  { type: 'service_client_info', label: 'Infos Client (Services)', sourceSheet: 'client', description: 'Raison sociale, adresse, SIRET et contact du bénéficiaire' },
  { type: 'service_invest_table', label: 'Tableau Produits (Services)', sourceSheet: 'invest_services', description: 'Tableau des lignes produits et services' },
  { type: 'service_conditions', label: 'Conditions Contrat', sourceSheet: 'données', description: 'Durée, date démarrage, périodicité, mode règlement, services souscrits' },
  { type: 'service_signature', label: 'Bloc Signature', sourceSheet: 'client', description: 'Bloc de signature avec noms du commercial et du client' }
];

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

// Résultat de vérification de suppression de page
export interface PageDeletionCheck {
  canDelete: boolean;
  hasWarning?: boolean;
  reason?: string;
  warning?: string;
  dynamicZonesCount?: number;
}

/**
 * Vérifie si une page a des zones dynamiques (protection dynamique)
 * Une page est considérée comme "protégée" si elle contient des zones dynamiques
 */
export function hasPageDynamicZones(pageNumber: number, dynamicZones: DynamicZone[]): boolean {
  return dynamicZones.some(zone => zone.pageNumber === pageNumber);
}

/**
 * Vérifie si une page est protégée par défaut (numéros 4, 5, 6 dans le contrat initial)
 * DEPRECATED: Utiliser hasPageDynamicZones pour une vérification basée sur les zones réelles
 */
export function isProtectedPage(pageNumber: number): boolean {
  // Maintenant, une page est protégée si elle a des zones dynamiques
  // Cette fonction est gardée pour la rétro-compatibilité mais devrait être remplacée
  return [4, 5, 6].includes(pageNumber);
}

/**
 * Génère un ID unique pour une zone dynamique
 */
export function generateDynamicZoneId(type: DynamicZoneType, pageNumber: number): string {
  return `${type}_page${pageNumber}_${Date.now()}`;
}
