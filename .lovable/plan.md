
# Plan : Couleur bleu clair pour les cartes Options et plus d'espace

## Problème identifié

Sur la Page 5 "Votre offre de services" :
1. Les cartes "Nos options" ont un fond blanc/gris similaire aux autres cartes au lieu d'un bleu clair distinctif
2. L'espacement entre la section "Services inclus" et la section "Nos options" n'est pas suffisant

## Modifications à appliquer

### 1. Appliquer un fond bleu clair à toute la carte Option

| Élément | Actuel | Nouveau |
|---------|--------|---------|
| Carte entière (Preview) | `border rounded` (blanc) | `border rounded bg-primary/5` (bleu très léger) |
| Header carte (Preview) | `bg-primary/10` (bleu léger) | `bg-primary/15` (bleu plus prononcé) |
| Carte entière (Export) | `background-color: #dbeafe` | Appliquer à toute la carte avec structure cohérente |

### 2. Augmenter l'espacement avant "Nos options"

| Élément | Actuel | Nouveau |
|---------|--------|---------|
| Marge avant titre "Nos options" (Preview) | `mt-4` | `mt-6` |
| Marge avant titre "Nos options" (Export) | `margin-top: 16px` | `margin-top: 24px` |

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Augmenter `mt-4` → `mt-6` + ajouter fond bleu à la carte entière (lignes 867, 873, 874) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Augmenter margin-top `16px` → `24px` + fond bleu clair cohérent (ligne 357, 363) |

## Détail des modifications

### RentalProposalPreview.tsx

```jsx
// AVANT (lignes 867, 873, 874)
<div className="mt-4 mb-1.5 flex items-center gap-2">
...
<div key={option.id} className="border rounded overflow-hidden">
  <div className="bg-primary/10 px-3 py-1.5 flex items-center gap-2">

// APRÈS
<div className="mt-6 mb-1.5 flex items-center gap-2">  // mt-4 → mt-6
...
<div key={option.id} className="border border-primary/20 rounded overflow-hidden bg-primary/5">  // fond bleu + bordure bleue
  <div className="bg-primary/15 px-3 py-1.5 flex items-center gap-2">  // header plus bleu
```

### RentalProposalExport.tsx

```html
<!-- AVANT (lignes 357, 363) -->
<div style="margin-top: 16px;">
...
<div style="margin-bottom: 6px; background-color: #dbeafe; border-radius: 4px; padding: 6px;">

<!-- APRÈS -->
<div style="margin-top: 24px;">  <!-- 16px → 24px -->
...
<div style="margin-bottom: 6px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; overflow: hidden;">
  <div style="background-color: #dbeafe; padding: 6px;">  <!-- header bleu -->
```

## Palette de couleurs utilisée

| Couleur Tailwind | Hex | Usage |
|------------------|-----|-------|
| `bg-primary/5` | `#eff6ff` (blue-50) | Fond carte Option |
| `bg-primary/15` | `#dbeafe` (blue-100) | Header carte Option |
| `border-primary/20` | `#bfdbfe` (blue-200) | Bordure carte Option |
| `bg-muted` | Gris | Fond cartes Services Inclus |

## Résultat attendu

```text
Page 5 - Cartes avec distinction de couleur
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ Services Inclus          (fond GRIS)   │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-Tection              (fond GRIS)   │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-Actif                (fond GRIS)   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│              ↕ + espace (24px)             │
│                                             │
│ ⚙ Nos options                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-maintenance     (fond BLEU CLAIR)  │ │ ← Carte bleue
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-Optimisée       (fond BLEU CLAIR)  │ │ ← Carte bleue
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-Spare           (fond BLEU CLAIR)  │ │ ← Carte bleue
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Points techniques

- Le fond `bg-primary/5` (#eff6ff) donne un bleu très subtil visible mais pas agressif
- Le header `bg-primary/15` (#dbeafe) est légèrement plus prononcé pour le titre
- La bordure `border-primary/20` (#bfdbfe) renforce la distinction avec les cartes grises
- L'espacement `mt-6` (24px) double presque la marge pour bien séparer les sections
- Cohérence WYSIWYG maintenue entre Preview et Export
