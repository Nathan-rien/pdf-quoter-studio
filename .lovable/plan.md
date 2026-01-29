
# Plan : Améliorer l'espacement et la mise en valeur des options

## Problème identifié

Sur la Page 5 "Votre offre de services" :
1. L'espace entre le bloc "Services Inclus" et la section "Nos options" est trop réduit
2. Les titres des cartes dans "Nos options" ne ressortent pas visuellement par rapport aux autres options

## Modifications à appliquer

### 1. Augmenter l'espacement avant "Nos options"

| Élément | Avant | Après |
|---------|-------|-------|
| Marge avant "Nos options" (Preview) | `mt-2` | `mt-4` |
| Marge avant "Nos options" (Export) | `margin-top: 8px` | `margin-top: 16px` |

### 2. Différencier les titres des cartes "Nos options"

Les titres des options dans l'encart "Nos options" auront une couleur légèrement différente (bleu primaire) pour les distinguer des options incluses.

| Élément | Avant | Après |
|---------|-------|-------|
| Couleur titre option (Preview) | `text-foreground` (noir) | `text-primary` (bleu) |
| Couleur titre option (Export) | `#000` (noir) | `#2563eb` (bleu) |

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Augmenter `mt-2` → `mt-4` et ajouter `text-primary` aux titres "Nos options" (lignes 867 et 877) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Augmenter margin-top et ajouter `color: #2563eb` aux titres (lignes 357 et 368) |

## Détail des modifications

### RentalProposalPreview.tsx (lignes 867-877)

```jsx
// AVANT
<div className="mt-2 mb-1.5 flex items-center gap-2">
  ...
</div>
...
<span className="font-semibold text-[11px]">{option.name}</span>

// APRÈS
<div className="mt-4 mb-1.5 flex items-center gap-2">  // mt-2 → mt-4
  ...
</div>
...
<span className="font-semibold text-[11px] text-primary">{option.name}</span>  // +text-primary
```

### RentalProposalExport.tsx (lignes 357 et 368)

```html
<!-- AVANT -->
<div style="margin-top: 8px;">
...
<span style="font-weight: 600; font-size: 9px;">${opt.name}</span>

<!-- APRÈS -->
<div style="margin-top: 16px;">  <!-- 8px → 16px -->
...
<span style="font-weight: 600; font-size: 9px; color: #2563eb;">${opt.name}</span>  <!-- +color -->
```

## Résultat attendu

```text
Page 5 - Espacement et couleurs améliorés
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │█ Services Inclus                        │ │ ← Titres noirs
│ │  • Contrat de location...               │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │✓ Pro-Tection                            │ │ ← Titres noirs
│ │  • Assurance casse...                   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│                  ↕ + espace                 │
│                                             │
│ ⚙ Nos options                              │
│ ┌─────────────────────────────────────────┐ │
│ │□ Pro-Optimisée                          │ │ ← Titre BLEU
│ │  • Optimisation fiscale...              │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │□ Pro-maintenance                        │ │ ← Titre BLEU
│ │  • Maintenance préventive...            │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Points techniques

- L'espacement `mt-4` (16px) double la marge actuelle pour créer une séparation visuelle claire
- La couleur `text-primary` (#2563eb bleu) est cohérente avec le thème de l'application
- Les modifications sont synchronisées entre Preview et Export pour maintenir la cohérence WYSIWYG
