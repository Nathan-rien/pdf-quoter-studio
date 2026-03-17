/**
 * Constantes partagées pour le rendu du canvas PDF
 * Utilisées par EditorCanvas, RentalProposalPreview, et RentalProposalExport
 * 
 * IMPORTANT: Ces valeurs doivent rester synchronisées entre tous les composants
 * pour garantir la fidélité WYSIWYG entre l'éditeur et l'aperçu.
 */

// Dimensions du canvas (ratio A4 : 210mm x 297mm)
export const CANVAS_SCALE = {
  width: 650,
  height: 919, // 650 * (297/210) ≈ 919
};

// Ratio A4 pour aspect-ratio CSS
export const A4_ASPECT_RATIO = '210 / 297';

// Facteur de mise à l'échelle pour le texte dans la preview
export const PREVIEW_FONT_SCALE = 0.4;

// Facteur de mise à l'échelle pour les icônes (identique éditeur/aperçu)
export const PREVIEW_ICON_SCALE = 0.6;

// Indentation des listes en pixels (avant scaling)
export const LIST_INDENT_PX = 12;

// Nombre de pages par défaut (référence historique)
// DÉPRÉCIÉ : Utiliser version.pages.length pour le nombre réel de pages
export const DEFAULT_CONTRACT_PAGES = 8;

// Constantes de pagination
export const OPTIONS_PER_PAGE = 6;
export const LINES_PER_PAGE = 12;

// Pagination du tableau investissements (multi-page)
// Page 4 (première page) : moins de place car titre + en-têtes + logo en bas
export const INVEST_LINES_PAGE1 = 30;
// Pages suivantes (continuation) : plus de place, juste le tableau
export const INVEST_LINES_CONTINUATION = 40;
// Nombre de lignes réservées pour le footer (DÉPRÉCIÉ : utiliser le calcul dynamique)
export const INVEST_FOOTER_RESERVED_LINES = 9;

// Lignes équivalentes par proposition dans "Votre offre" (titre + lignes de détail + marges)
export const INVEST_LINES_PER_PROPOSAL = 4;
// Lignes de base du footer (titre "Votre offre" + éléments flow + commentaire + marges)
export const INVEST_FOOTER_BASE_LINES = 4;

// Calcule dynamiquement le nombre de lignes nécessaires pour le footer
export function computeFooterLines(proposalCount: number): number {
  return INVEST_FOOTER_BASE_LINES + proposalCount * INVEST_LINES_PER_PROPOSAL;
}

// Seuil en single-page : au-delà de ce nombre de lignes,
// le footer (Votre offre + Avantages + Conditions) est déporté sur une page dédiée
export const INVEST_SINGLE_PAGE_FOOTER_THRESHOLD = Math.floor(INVEST_LINES_PAGE1 / 2); // 11

// Pagination des services/options (Page 5)
// Chaque bloc = 1 service inclus, 1 option, ou 1 titre "Nos options"
// Le bloc "Services location" permanent compte pour 1 bloc
export const SERVICES_ITEMS_PAGE1 = 8;       // blocs max sur page 1 (avec titre + Services location)
export const SERVICES_ITEMS_CONTINUATION = 12; // blocs max sur pages de continuation

// Caractères par ligne visuelle dans la colonne Désignation (~60% de largeur)
const CHARS_PER_VISUAL_LINE = 60;

// Hauteur visuelle d'une seule ligne de produit
function singleLineVisualHeight(ligne: { designation?: string | null; isSeparator?: boolean }): number {
  if (ligne.isSeparator) return 1;
  const text = ligne.designation || '';
  const explicit = text.split('\n');
  return Math.max(1, explicit.reduce((s, l) => s + Math.max(1, Math.ceil(l.length / CHARS_PER_VISUAL_LINE)), 0));
}

// Estime le nombre de lignes visuelles qu'occupe une liste de produits
export function estimateVisualLines(
  lignes: Array<{ designation?: string | null; isSeparator?: boolean }>
): number {
  return lignes.reduce((total, ligne) => total + singleLineVisualHeight(ligne), 0);
}

/**
 * Découpe les lignes en chunks contenant le **nombre de lignes réelles** (pas visuelles)
 * qui tiennent sur chaque page, en accumulant la hauteur visuelle estimée.
 * 
 * Retourne un tableau de nombres : chaque élément = nombre de lignes réelles pour cette page.
 * Un élément à 0 signifie "page dédiée au footer uniquement".
 */
export function chunkLinesByVisualHeight(
  lignes: Array<{ designation?: string | null; isSeparator?: boolean }>,
  page1Capacity: number,
  continuationCapacity: number,
  footerLines: number
): number[] {
  if (lignes.length === 0) return [0];

  const heights = lignes.map(singleLineVisualHeight);
  const totalVisual = heights.reduce((a, b) => a + b, 0);

  // Cas 1 : tout tient sur une page avec le footer
  if (totalVisual + footerLines <= page1Capacity) return [lignes.length];

  // Cas 2 : données tiennent sur page 1 mais pas le footer → page footer dédiée
  if (totalVisual <= page1Capacity) return [lignes.length, 0];

  // Cas 3 : multi-page — assigner les lignes réelles par accumulation de hauteur
  const chunks: number[] = [];
  let currentCapacity = page1Capacity;
  let accumulated = 0;
  let rowCount = 0;

  for (let i = 0; i < lignes.length; i++) {
    if (accumulated + heights[i] > currentCapacity && rowCount > 0) {
      chunks.push(rowCount);
      rowCount = 0;
      accumulated = 0;
      currentCapacity = continuationCapacity;
    }
    accumulated += heights[i];
    rowCount++;
  }
  if (rowCount > 0) chunks.push(rowCount);

  // Vérifier si le footer tient dans le dernier chunk
  const lastChunkRows = chunks[chunks.length - 1];
  const lastChunkVisual = heights
    .slice(lignes.length - lastChunkRows)
    .reduce((a, b) => a + b, 0);

  const lastCap = chunks.length === 1 ? page1Capacity : continuationCapacity;
  if (lastChunkVisual + footerLines > lastCap) {
    chunks.push(0); // page footer dédiée
  }

  return chunks;
}

// Largeur maximale d'affichage du canvas (identique Éditeur/Aperçu)
export const CANVAS_DISPLAY_MAX_WIDTH = 580;
