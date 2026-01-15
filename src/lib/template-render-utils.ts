/**
 * Utilitaires partagés pour le rendu des éléments de template
 * Utilisés par EditorCanvas et RentalProposalPreview pour garantir la fidélité WYSIWYG
 */

import { CANVAS_SCALE } from './canvas-constants';
import type { EditableElement, ShapeContent } from '@/types/template-editor';

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
