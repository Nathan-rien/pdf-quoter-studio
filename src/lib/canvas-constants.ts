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
export const INVEST_LINES_PAGE1 = 22;
// Pages suivantes (continuation) : plus de place, juste le tableau
export const INVEST_LINES_CONTINUATION = 32;
// Nombre de lignes réservées pour le footer (DÉPRÉCIÉ : utiliser le calcul dynamique)
export const INVEST_FOOTER_RESERVED_LINES = 9;

// Lignes équivalentes par proposition dans "Votre offre" (titre + lignes de détail + marges)
export const INVEST_LINES_PER_PROPOSAL = 4;
// Lignes de base du footer (titre "Votre offre" + éléments flow + commentaire + marges)
export const INVEST_FOOTER_BASE_LINES = 5;

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
const CHARS_PER_VISUAL_LINE = 45;

// Estime le nombre de lignes visuelles qu'occupe une liste de produits
export function estimateVisualLines(
  lignes: Array<{ designation?: string | null; isSeparator?: boolean }>
): number {
  return lignes.reduce((total, ligne) => {
    if (ligne.isSeparator) return total + 1;
    const text = ligne.designation || '';
    const explicitLines = text.split('\n');
    const visualLines = explicitLines.reduce((sum, line) => {
      return sum + Math.max(1, Math.ceil(line.length / CHARS_PER_VISUAL_LINE));
    }, 0);
    return total + Math.max(1, visualLines);
  }, 0);
}

// Largeur maximale d'affichage du canvas (identique Éditeur/Aperçu)
export const CANVAS_DISPLAY_MAX_WIDTH = 580;
