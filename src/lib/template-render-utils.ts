/**
 * Utilitaires partagés pour le rendu des éléments de template
 * Utilisés par EditorCanvas et RentalProposalPreview pour garantir la fidélité WYSIWYG
 */

import { CANVAS_SCALE } from './canvas-constants';
import { getLogoById } from './template-logos';
import type { EditableElement, ShapeContent, ImageContent } from '@/types/template-editor';

/**
 * Noms des mois en français pour la substitution de date
 */
const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Retourne la date actuelle au format "Mois année" en français
 */
export const getCurrentDateFR = (): string => {
  const now = new Date();
  const jour = now.getDate().toString().padStart(2, '0');
  const mois = MOIS_FR[now.getMonth()].toLowerCase();
  return `${jour} ${mois} ${now.getFullYear()}`;
};

/**
 * Contexte optionnel pour la substitution dynamique
 */
export interface SubstitutionContext {
  fraisDossier?: number | null;
}

/**
 * Formate les frais de dossier selon les règles métier :
 * - 0 → "0"
 * - 60 → "60,00"
 * - null/undefined → "–"
 */
const formatFraisDossier = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '–';
  if (value === 0) return '0';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

/**
 * Substitue les placeholders dynamiques dans un texte
 * - {{DATE}} : remplacé par le mois et l'année en cours
 * - {{FRAIS_DOSSIER}} : remplacé par les frais de dossier formatés
 * - Auto-détection des dates "Mois 20XX" : remplacées par le mois en cours
 */
export const substituteDynamicPlaceholders = (text: string, context?: SubstitutionContext): string => {
  if (!text) return text;
  
  const currentDate = getCurrentDateFR();
  
  // Remplacer le placeholder explicite {{DATE}}
  let result = text.replace(/\{\{DATE\}\}/gi, currentDate);
  
  // Remplacer le placeholder {{FRAIS_DOSSIER}}
  if (context && context.fraisDossier !== undefined) {
    result = result.replace(/\{\{FRAIS_DOSSIER\}\}/gi, formatFraisDossier(context.fraisDossier));
  } else {
    result = result.replace(/\{\{FRAIS_DOSSIER\}\}/gi, formatFraisDossier(null));
  }
  
  // Auto-détection : remplacer "Mois 20XX" par la date actuelle
  // Pattern : un mois français suivi d'un espace et d'une année 20XX
  const moisPattern = MOIS_FR.join('|');
  const dateRegex = new RegExp(`(${moisPattern})\\s+20\\d{2}`, 'gi');
  result = result.replace(dateRegex, currentDate);
  
  // Auto-détection : injecter les frais de dossier dans les templates existants
  // Couvre "Frais de dossier bancaire" seul ou suivi d'un ancien montant en dur
  const fraisValue = context?.fraisDossier !== undefined ? formatFraisDossier(context.fraisDossier) : formatFraisDossier(null);
  const fraisRegex = /Frais de dossier bancaire(?:\s+[\d,.\s]+(?:€|EUR)\s*HT\.?)?/gi;
  result = result.replace(fraisRegex, `Frais de dossier bancaire ${fraisValue} € HT`);
  
  return result;
};

interface ElementStyleOptions {
  element: EditableElement;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * Calcule le style CSS d'un élément de template
 * Cette fonction DOIT être identique dans l'éditeur et l'aperçu
 */
export const getSharedElementStyle = ({ element, canvasWidth = CANVAS_SCALE.width, canvasHeight = CANVAS_SCALE.height }: ElementStyleOptions): React.CSSProperties => {
  const leftPercent = Math.min((element.position.x / canvasWidth) * 100, 100);
  const topPercent = Math.min((element.position.y / canvasHeight) * 100, 100);
  
  // Récupérer la rotation depuis le contenu shape si applicable
  const shapeContent = element.type === 'shape' ? (element.content as ShapeContent) : null;
  const rotation = shapeContent?.rotation || 0;
  
  // Pour le texte : width fit-content avec maxWidth, height auto
  if (element.type === 'text') {
    const maxWidthPercent = Math.max(Math.min((element.size.width / canvasWidth) * 100, 100), 5);
    return {
      position: 'absolute' as const,
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
      width: 'fit-content',
      maxWidth: `${maxWidthPercent}%`,
      height: 'auto',
      zIndex: element.zIndex || 1,
      transformOrigin: 'top left',
    };
  }
  
  // Pour les autres éléments : width et height en pourcentage avec clamp minimum
  const widthPercent = Math.max(Math.min((element.size.width / canvasWidth) * 100, 100), 3);
  const heightPercent = Math.max((element.size.height / canvasHeight) * 100, 2);
  
  return {
    position: 'absolute' as const,
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
    width: `${widthPercent}%`,
    height: `${heightPercent}%`,
    zIndex: element.zIndex || 1,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: 'top left',
  };
};

/**
 * Trie les éléments par zIndex pour un rendu cohérent
 */
export const sortElementsByZIndex = (elements: EditableElement[]): EditableElement[] => {
  return [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
};

/**
 * Résout l'URL d'une image en utilisant logoId si disponible
 * Avec fallback pour les anciens chemins de logos persistés
 */
export const resolveImageUrl = (content: ImageContent | null): string | undefined => {
  if (!content) return undefined;
  
  // Si logoId est présent, résoudre dynamiquement via getLogoById
  if (content.logoId) {
    const logo = getLogoById(content.logoId);
    if (logo) return logo.url;
  }
  
  // Fallback : détecter les anciens chemins Vite de logos et les résoudre
  if (content.imageUrl?.includes('/src/assets/logos/') || content.imageUrl?.includes('assets/logos/')) {
    const logoIdMatch = content.imageUrl.match(/cbpro-[a-z-]+/);
    if (logoIdMatch) {
      const logo = getLogoById(logoIdMatch[0]);
      if (logo) return logo.url;
    }
  }
  
  return content.imageUrl;
};
