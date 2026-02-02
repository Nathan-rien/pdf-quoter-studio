/**
 * Styles autorisés pour l'éditeur de template (listes fermées)
 * Aucun style personnalisé n'est permis en dehors de ces définitions
 */

import type { AllowedFontSize, TextPresetStyle, ShapeType } from '@/types/template-editor';

// Palette couleurs autorisée pour le texte (étendue à 40 couleurs)
export const ALLOWED_COLORS = [
  // Neutres (8)
  { name: 'Noir', value: '#000000', category: 'neutral' },
  { name: 'Gris 800', value: '#1f2937', category: 'neutral' },
  { name: 'Gris 700', value: '#374151', category: 'neutral' },
  { name: 'Gris 600', value: '#4b5563', category: 'neutral' },
  { name: 'Gris 500', value: '#6b7280', category: 'neutral' },
  { name: 'Gris 400', value: '#9ca3af', category: 'neutral' },
  { name: 'Gris 300', value: '#d1d5db', category: 'neutral' },
  { name: 'Blanc', value: '#ffffff', category: 'neutral' },
  // Bleus (8)
  { name: 'Navy', value: '#1e3a5f', category: 'blue' },
  { name: 'Bleu 900', value: '#1e3b8a', category: 'blue' },
  { name: 'Bleu 700', value: '#1d4ed8', category: 'blue' },
  { name: 'Bleu 500', value: '#3b82f6', category: 'blue' },
  { name: 'Bleu 400', value: '#60a5fa', category: 'blue' },
  { name: 'Bleu 300', value: '#93c5fd', category: 'blue' },
  { name: 'Sky', value: '#0ea5e9', category: 'blue' },
  { name: 'Cyan', value: '#06b6d4', category: 'blue' },
  // Verts (6)
  { name: 'Vert 800', value: '#166534', category: 'green' },
  { name: 'Emeraude', value: '#10b981', category: 'green' },
  { name: 'Vert 500', value: '#22c55e', category: 'green' },
  { name: 'Vert 400', value: '#4ade80', category: 'green' },
  { name: 'Teal', value: '#14b8a6', category: 'green' },
  { name: 'Lime', value: '#84cc16', category: 'green' },
  // Rouges / Orange (6)
  { name: 'Rouge 800', value: '#991b1b', category: 'red' },
  { name: 'Rouge 500', value: '#ef4444', category: 'red' },
  { name: 'Rouge 400', value: '#f87171', category: 'red' },
  { name: 'Orange', value: '#f97316', category: 'red' },
  { name: 'Ambre', value: '#f59e0b', category: 'red' },
  { name: 'Jaune', value: '#eab308', category: 'red' },
  // Violets / Roses (6)
  { name: 'Violet 700', value: '#7c3aed', category: 'purple' },
  { name: 'Violet 500', value: '#a855f7', category: 'purple' },
  { name: 'Violet 400', value: '#c084fc', category: 'purple' },
  { name: 'Rose 500', value: '#ec4899', category: 'purple' },
  { name: 'Rose 400', value: '#f472b6', category: 'purple' },
  { name: 'Fuchsia', value: '#d946ef', category: 'purple' },
  // Autres (6)
  { name: 'Indigo', value: '#4f46e5', category: 'other' },
  { name: 'Slate', value: '#64748b', category: 'other' },
  { name: 'Zinc', value: '#71717a', category: 'other' },
  { name: 'Stone', value: '#78716c', category: 'other' },
  { name: 'Brown', value: '#a16207', category: 'other' },
  { name: 'Pink', value: '#db2777', category: 'other' },
] as const;

// Couleurs de fond pour les formes (étendue à 55 couleurs)
export const SHAPE_BACKGROUND_COLORS = [
  // Spéciaux (1)
  { name: 'Transparent', value: 'transparent', category: 'special' },
  // Neutres (8)
  { name: 'Blanc', value: '#ffffff', category: 'neutral' },
  { name: 'Gris 50', value: '#f9fafb', category: 'neutral' },
  { name: 'Gris 100', value: '#f3f4f6', category: 'neutral' },
  { name: 'Gris 200', value: '#e5e7eb', category: 'neutral' },
  { name: 'Gris 300', value: '#d1d5db', category: 'neutral' },
  { name: 'Gris 500', value: '#6b7280', category: 'neutral' },
  { name: 'Gris 800', value: '#1f2937', category: 'neutral' },
  { name: 'Noir', value: '#000000', category: 'neutral' },
  // Bleus (10)
  { name: 'Navy', value: '#1e3a5f', category: 'blue' },
  { name: 'Bleu 900', value: '#1e3b8a', category: 'blue' },
  { name: 'Bleu 700', value: '#1d4ed8', category: 'blue' },
  { name: 'Bleu 500', value: '#3b82f6', category: 'blue' },
  { name: 'Bleu 400', value: '#60a5fa', category: 'blue' },
  { name: 'Bleu 300', value: '#93c5fd', category: 'blue' },
  { name: 'Bleu 100', value: '#dbeafe', category: 'blue' },
  { name: 'Sky', value: '#0ea5e9', category: 'blue' },
  { name: 'Cyan', value: '#06b6d4', category: 'blue' },
  { name: 'Cyan pâle', value: '#cffafe', category: 'blue' },
  // Verts (8)
  { name: 'Vert 800', value: '#166534', category: 'green' },
  { name: 'Emeraude', value: '#10b981', category: 'green' },
  { name: 'Vert 500', value: '#22c55e', category: 'green' },
  { name: 'Vert 400', value: '#4ade80', category: 'green' },
  { name: 'Vert 200', value: '#bbf7d0', category: 'green' },
  { name: 'Vert 100', value: '#dcfce7', category: 'green' },
  { name: 'Teal', value: '#14b8a6', category: 'green' },
  { name: 'Lime', value: '#84cc16', category: 'green' },
  // Jaunes / Orange (8)
  { name: 'Jaune 500', value: '#eab308', category: 'yellow' },
  { name: 'Jaune 400', value: '#facc15', category: 'yellow' },
  { name: 'Jaune 100', value: '#fef9c3', category: 'yellow' },
  { name: 'Orange', value: '#f97316', category: 'yellow' },
  { name: 'Ambre', value: '#f59e0b', category: 'yellow' },
  { name: 'Orange 200', value: '#fed7aa', category: 'yellow' },
  { name: 'Ambre 100', value: '#fef3c7', category: 'yellow' },
  { name: 'Orange 100', value: '#ffedd5', category: 'yellow' },
  // Rouges (8)
  { name: 'Rouge 800', value: '#991b1b', category: 'red' },
  { name: 'Rouge 600', value: '#dc2626', category: 'red' },
  { name: 'Rouge 500', value: '#ef4444', category: 'red' },
  { name: 'Rouge 400', value: '#f87171', category: 'red' },
  { name: 'Rouge 300', value: '#fca5a5', category: 'red' },
  { name: 'Rouge 100', value: '#fee2e2', category: 'red' },
  { name: 'Rose foncé', value: '#be185d', category: 'red' },
  { name: 'Corail', value: '#fb7185', category: 'red' },
  // Violets / Roses (10)
  { name: 'Violet 700', value: '#7c3aed', category: 'purple' },
  { name: 'Violet 500', value: '#a855f7', category: 'purple' },
  { name: 'Violet 400', value: '#c084fc', category: 'purple' },
  { name: 'Violet 200', value: '#ddd6fe', category: 'purple' },
  { name: 'Violet 100', value: '#ede9fe', category: 'purple' },
  { name: 'Rose 500', value: '#ec4899', category: 'purple' },
  { name: 'Rose 400', value: '#f472b6', category: 'purple' },
  { name: 'Rose 200', value: '#fbcfe8', category: 'purple' },
  { name: 'Fuchsia', value: '#d946ef', category: 'purple' },
  { name: 'Indigo', value: '#4f46e5', category: 'purple' },
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
