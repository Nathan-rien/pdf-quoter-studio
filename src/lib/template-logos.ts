/**
 * Configuration des logos disponibles pour l'éditeur de template
 */

import cbproBlkStrokeBaseline from '@/assets/logos/cbpro-blk-stroke-baseline.svg';
import cbproWhtFilled from '@/assets/logos/cbpro-wht-filled.svg';
import cbproWhtFilledBaseline from '@/assets/logos/cbpro-wht-filled-baseline.svg';
import cbproWhtStroke from '@/assets/logos/cbpro-wht-stroke.svg';
import cbproWhtStrokeBaseline from '@/assets/logos/cbpro-wht-stroke-baseline.svg';
import { CANVAS_SCALE } from '@/lib/canvas-constants';

export interface TemplateLogo {
  id: string;
  name: string;
  description: string;
  url: string;
  variant: 'black' | 'white';
  style: 'filled' | 'stroke';
  hasBaseline: boolean;
  previewBg: 'light' | 'dark';
}

export const TEMPLATE_LOGOS: TemplateLogo[] = [
  {
    id: 'cbpro-blk-stroke-baseline',
    name: 'Noir Baseline',
    description: 'Logo noir avec trait et baseline',
    url: cbproBlkStrokeBaseline,
    variant: 'black',
    style: 'stroke',
    hasBaseline: true,
    previewBg: 'light'
  },
  {
    id: 'cbpro-wht-filled',
    name: 'Blanc Plein',
    description: 'Logo blanc rempli sans baseline',
    url: cbproWhtFilled,
    variant: 'white',
    style: 'filled',
    hasBaseline: false,
    previewBg: 'dark'
  },
  {
    id: 'cbpro-wht-filled-baseline',
    name: 'Blanc Plein BL',
    description: 'Logo blanc rempli avec baseline',
    url: cbproWhtFilledBaseline,
    variant: 'white',
    style: 'filled',
    hasBaseline: true,
    previewBg: 'dark'
  },
  {
    id: 'cbpro-wht-stroke',
    name: 'Blanc Trait',
    description: 'Logo blanc avec trait sans baseline',
    url: cbproWhtStroke,
    variant: 'white',
    style: 'stroke',
    hasBaseline: false,
    previewBg: 'dark'
  },
  {
    id: 'cbpro-wht-stroke-baseline',
    name: 'Blanc Trait BL',
    description: 'Logo blanc avec trait et baseline',
    url: cbproWhtStrokeBaseline,
    variant: 'white',
    style: 'stroke',
    hasBaseline: true,
    previewBg: 'dark'
  }
];

// Taille par défaut pour un logo en footer
export const DEFAULT_FOOTER_LOGO_SIZE = { width: 80, height: 35 };

// Positions prédéfinies pour les logos (en pixels du canvas)
export const LOGO_POSITIONS = {
  bottomRight: { 
    x: Math.round(CANVAS_SCALE.width * 0.85) - DEFAULT_FOOTER_LOGO_SIZE.width,  // ~472
    y: Math.round(CANVAS_SCALE.height * 0.92) - DEFAULT_FOOTER_LOGO_SIZE.height // ~810
  },
  bottomLeft: { 
    x: Math.round(CANVAS_SCALE.width * 0.05),    // ~32
    y: Math.round(CANVAS_SCALE.height * 0.92) - DEFAULT_FOOTER_LOGO_SIZE.height
  },
  topRight: { 
    x: Math.round(CANVAS_SCALE.width * 0.85) - DEFAULT_FOOTER_LOGO_SIZE.width, 
    y: Math.round(CANVAS_SCALE.height * 0.02)     // ~18
  },
  topLeft: { 
    x: Math.round(CANVAS_SCALE.width * 0.05), 
    y: Math.round(CANVAS_SCALE.height * 0.02) 
  }
} as const;

export function getLogoById(id: string): TemplateLogo | undefined {
  return TEMPLATE_LOGOS.find(logo => logo.id === id);
}
