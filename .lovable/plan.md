

# Plan : Ajouter le logo GrosbillPro à l'éditeur de template

## Résumé

Ajouter le logo GrosbillPro (bleu et gris) à la bibliothèque de logos de l'éditeur de template, permettant aux utilisateurs de l'utiliser dans leurs propositions commerciales.

## Modifications prévues

### 1. Copier le fichier SVG

Copier le logo uploadé dans le dossier des assets :

| Source | Destination |
|--------|-------------|
| `user-uploads://logo_grosbill-01.svg` | `src/assets/logos/grosbill-color.svg` |

### 2. Mettre à jour l'interface TypeScript

Modifier l'interface `TemplateLogo` dans `src/lib/template-logos.ts` pour supporter la nouvelle variante de couleur :

```typescript
// AVANT
variant: 'black' | 'white';

// APRÈS
variant: 'black' | 'white' | 'color';
```

### 3. Ajouter l'import et la configuration du logo

Dans `src/lib/template-logos.ts`, ajouter :

```typescript
// Nouvel import
import grosbillColor from '@/assets/logos/grosbill-color.svg';

// Nouvelle entrée dans TEMPLATE_LOGOS
{
  id: 'grosbill-color',
  name: 'GrosbillPro',
  description: 'Logo GrosbillPro couleur (bleu/gris)',
  url: grosbillColor,
  variant: 'color',
  style: 'filled',
  hasBaseline: true,
  previewBg: 'light'  // Fond clair car le logo est coloré
}
```

## Structure des fichiers

```text
src/assets/logos/
├── cbpro-blk-stroke-baseline.svg
├── cbpro-wht-filled-baseline.svg
├── cbpro-wht-filled.svg
├── cbpro-wht-stroke-baseline.svg
├── cbpro-wht-stroke.svg
└── grosbill-color.svg          ← NOUVEAU
```

## Rendu dans la sidebar

Le nouveau logo apparaîtra dans la section "Logos" avec :
- Un fond clair (blanc/gris clair) pour mettre en valeur les couleurs
- Le nom "GrosbillPro" affiché au survol
- Les mêmes fonctionnalités que les autres logos (placement individuel ou sur toutes les pages)

## Impact

- Aucune modification du composant `EditorSidebar.tsx` nécessaire (il itère déjà sur `TEMPLATE_LOGOS`)
- Le logo sera automatiquement disponible dans tous les templates
- La résolution via `getLogoById('grosbill-color')` fonctionnera immédiatement

