/**
 * Styles autorisés pour l'éditeur de template (listes fermées)
 * Aucun style personnalisé n'est permis en dehors de ces définitions
 */

import type { AllowedFontSize, TextPresetStyle, ShapeType } from '@/types/template-editor';

// Palette couleurs autorisée
export const ALLOWED_COLORS = [
  { name: 'Primary', value: '#1e3a5f' },      // Navy
  { name: 'Secondary', value: '#10b981' },    // Emerald
  { name: 'Accent', value: '#0ea5e9' },       // Sky
  { name: 'Text', value: '#1f2937' },         // Gray 800
  { name: 'Muted', value: '#6b7280' },        // Gray 500
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
] as const;

// Couleurs de fond pour les formes (étend la palette existante)
export const SHAPE_BACKGROUND_COLORS = [
  { name: 'Transparent', value: 'transparent' },
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Gray', value: '#e5e7eb' },
  { name: 'Primary', value: '#1e3a5f' },
  { name: 'Secondary', value: '#10b981' },
  { name: 'Accent', value: '#0ea5e9' },
  { name: 'Light Blue', value: '#dbeafe' },
  { name: 'Light Green', value: '#dcfce7' },
  { name: 'Light Yellow', value: '#fef9c3' },
  { name: 'Light Red', value: '#fee2e2' },
  { name: 'Black', value: '#000000' },
] as const;

// Polices autorisées
export const ALLOWED_FONTS = [
  { name: 'Garet', value: 'Outfit, sans-serif' },
  { name: 'DM Sans', value: '"DM Sans", sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
] as const;

// Tailles autorisées
export const ALLOWED_FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32] as const;

// Styles de texte prédéfinis
export const TEXT_PRESET_STYLES: Record<TextPresetStyle, {
  fontSize: AllowedFontSize;
  bold: boolean;
  italic?: boolean;
  color: string;
}> = {
  titre: {
    fontSize: 24,
    bold: true,
    color: '#1e3a5f', // Primary
  },
  sousTitre: {
    fontSize: 18,
    bold: true,
    color: '#1f2937', // Text
  },
  texte: {
    fontSize: 12,
    bold: false,
    color: '#1f2937', // Text
  },
  note: {
    fontSize: 10,
    bold: false,
    italic: true,
    color: '#6b7280', // Muted
  },
} as const;

// Rotations autorisées pour les images et formes
export const ALLOWED_ROTATIONS = [0, 90, 180, 270] as const;

// Épaisseurs de bordure autorisées
export const ALLOWED_BORDER_WIDTHS = [1, 2, 3, 4, 5] as const;

// Rayons de coins autorisés
export const ALLOWED_CORNER_RADII = [0, 4, 8, 12, 16, 24, 32, 50] as const;

// Icônes disponibles pour les formes (liste fermée)
export const ALLOWED_SHAPE_ICONS = [
  'Check', 'X', 'Star', 'Heart', 'Phone', 'Mail', 'User',
  'Home', 'Settings', 'Bell', 'Calendar', 'Clock', 'Search',
  'Plus', 'Minus', 'ArrowRight', 'ArrowLeft', 'ChevronRight', 'ChevronDown',
  'FileText', 'Folder', 'Image', 'Link', 'ExternalLink', 'Download',
  'Upload', 'Share', 'Copy', 'Trash', 'Edit', 'Eye', 'EyeOff'
] as const;

// Tailles par défaut pour chaque type de forme
export const SHAPE_DEFAULT_SIZES: Record<ShapeType, { width: number; height: number }> = {
  rectangle: { width: 120, height: 60 },
  square: { width: 80, height: 80 },
  'rounded-rectangle': { width: 120, height: 60 },
  circle: { width: 60, height: 60 },
  ellipse: { width: 100, height: 60 },
  line: { width: 100, height: 2 },
};

// Validation qu'une couleur est autorisée
export function isAllowedColor(color: string): boolean {
  return ALLOWED_COLORS.some(c => c.value.toLowerCase() === color.toLowerCase());
}

// Validation qu'une police est autorisée
export function isAllowedFont(font: string): boolean {
  return ALLOWED_FONTS.some(f => f.value === font || f.name === font);
}

// Validation qu'une taille est autorisée
export function isAllowedFontSize(size: number): boolean {
  return (ALLOWED_FONT_SIZES as readonly number[]).includes(size);
}

// Type pour les couleurs autorisées
export type AllowedColorValue = typeof ALLOWED_COLORS[number]['value'];

// Type pour les polices autorisées  
export type AllowedFontValue = typeof ALLOWED_FONTS[number]['value'];

// Type pour les tailles autorisées
export type AllowedFontSizeValue = typeof ALLOWED_FONT_SIZES[number];
