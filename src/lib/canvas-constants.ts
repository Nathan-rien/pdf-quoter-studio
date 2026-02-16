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
export const INVEST_LINES_PAGE1 = 26;
// Pages suivantes (continuation) : plus de place, juste le tableau
export const INVEST_LINES_CONTINUATION = 36;

// Largeur maximale d'affichage du canvas (identique Éditeur/Aperçu)
export const CANVAS_DISPLAY_MAX_WIDTH = 580;
