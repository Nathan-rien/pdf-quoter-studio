/**
 * Styles autorisés pour l'éditeur de template (listes fermées)
 * Aucun style personnalisé n'est permis en dehors de ces définitions
 */

import type { AllowedFontSize, TextPresetStyle, ShapeType } from '@/types/template-editor';

// Palette couleurs autorisée pour le texte (étendue)
export const ALLOWED_COLORS = [
  // Neutres
  { name: 'Noir', value: '#000000', category: 'neutral' },
  { name: 'Gris foncé', value: '#1f2937', category: 'neutral' },
  { name: 'Gris', value: '#6b7280', category: 'neutral' },
  { name: 'Gris clair', value: '#9ca3af', category: 'neutral' },
  { name: 'Blanc', value: '#ffffff', category: 'neutral' },
  // Primaires
  { name: 'Navy', value: '#1e3a5f', category: 'primary' },
  { name: 'Bleu foncé', value: '#1e40af', category: 'primary' },
  { name: 'Bleu', value: '#3b82f6', category: 'primary' },
  { name: 'Bleu clair', value: '#60a5fa', category: 'primary' },
  { name: 'Sky', value: '#0ea5e9', category: 'primary' },
  // Verts
  { name: 'Vert foncé', value: '#166534', category: 'success' },
  { name: 'Emeraude', value: '#10b981', category: 'success' },
  { name: 'Vert', value: '#22c55e', category: 'success' },
  { name: 'Vert clair', value: '#86efac', category: 'success' },
  // Rouges / Orange
  { name: 'Rouge foncé', value: '#991b1b', category: 'danger' },
  { name: 'Rouge', value: '#ef4444', category: 'danger' },
  { name: 'Orange', value: '#f97316', category: 'danger' },
  { name: 'Ambre', value: '#f59e0b', category: 'danger' },
  // Violets / Roses
  { name: 'Violet foncé', value: '#7c3aed', category: 'accent' },
  { name: 'Violet', value: '#a855f7', category: 'accent' },
  { name: 'Rose', value: '#ec4899', category: 'accent' },
  { name: 'Fuchsia', value: '#d946ef', category: 'accent' },
] as const;

// Couleurs de fond pour les formes (étendue)
export const SHAPE_BACKGROUND_COLORS = [
  // Spéciaux
  { name: 'Transparent', value: 'transparent', category: 'special' },
  // Neutres
  { name: 'Blanc', value: '#ffffff', category: 'neutral' },
  { name: 'Gris très clair', value: '#f9fafb', category: 'neutral' },
  { name: 'Gris clair', value: '#f3f4f6', category: 'neutral' },
  { name: 'Gris', value: '#e5e7eb', category: 'neutral' },
  { name: 'Gris moyen', value: '#d1d5db', category: 'neutral' },
  { name: 'Noir', value: '#000000', category: 'neutral' },
  // Bleus
  { name: 'Navy', value: '#1e3a5f', category: 'blue' },
  { name: 'Bleu foncé', value: '#1e40af', category: 'blue' },
  { name: 'Bleu', value: '#3b82f6', category: 'blue' },
  { name: 'Bleu clair', value: '#93c5fd', category: 'blue' },
  { name: 'Bleu pâle', value: '#dbeafe', category: 'blue' },
  { name: 'Sky', value: '#0ea5e9', category: 'blue' },
  // Verts
  { name: 'Vert foncé', value: '#166534', category: 'green' },
  { name: 'Emeraude', value: '#10b981', category: 'green' },
  { name: 'Vert', value: '#22c55e', category: 'green' },
  { name: 'Vert clair', value: '#86efac', category: 'green' },
  { name: 'Vert pâle', value: '#dcfce7', category: 'green' },
  // Jaunes / Orange
  { name: 'Jaune', value: '#facc15', category: 'yellow' },
  { name: 'Jaune pâle', value: '#fef9c3', category: 'yellow' },
  { name: 'Orange', value: '#f97316', category: 'yellow' },
  { name: 'Ambre', value: '#f59e0b', category: 'yellow' },
  { name: 'Orange pâle', value: '#fed7aa', category: 'yellow' },
  // Rouges
  { name: 'Rouge foncé', value: '#991b1b', category: 'red' },
  { name: 'Rouge', value: '#ef4444', category: 'red' },
  { name: 'Rouge clair', value: '#fca5a5', category: 'red' },
  { name: 'Rouge pâle', value: '#fee2e2', category: 'red' },
  // Violets / Roses
  { name: 'Violet foncé', value: '#7c3aed', category: 'purple' },
  { name: 'Violet', value: '#a855f7', category: 'purple' },
  { name: 'Violet pâle', value: '#e9d5ff', category: 'purple' },
  { name: 'Rose', value: '#ec4899', category: 'purple' },
  { name: 'Rose pâle', value: '#fbcfe8', category: 'purple' },
] as const;

// Polices autorisées
export const ALLOWED_FONTS = [
  { name: 'Garet', value: 'Outfit, sans-serif' },
  { name: 'DM Sans', value: '"DM Sans", sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
] as const;

// Tailles autorisées
export const ALLOWED_FONT_SIZES = [9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96] as const;

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

// Rotations étendues pour les lignes (incluant diagonales)
export const ALLOWED_LINE_ROTATIONS = [0, 45, 90, 135, 180] as const;

// Épaisseurs de bordure autorisées
export const ALLOWED_BORDER_WIDTHS = [1, 2, 3, 4, 5] as const;

// Rayons de coins autorisés
export const ALLOWED_CORNER_RADII = [0, 4, 8, 12, 16, 24, 32, 50] as const;

// Styles de ligne disponibles
export const LINE_STYLES = [
  { name: 'Solide', value: 'solid' as const },
  { name: 'Tirets', value: 'dashed' as const },
  { name: 'Pointillés', value: 'dotted' as const },
] as const;

export type LineStyleValue = typeof LINE_STYLES[number]['value'];

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
  'line-vertical': { width: 2, height: 100 },
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
