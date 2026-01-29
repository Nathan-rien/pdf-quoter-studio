
# Plan : Faire ressortir la couleur de la carte Option

## Modification demandée

Revenir en arrière sur la couleur bleue des titres et appliquer plutôt une couleur de fond distinctive à la carte Option entière dans la section "Nos options".

## Changements à appliquer

### 1. Revenir en arrière sur les titres

| Élément | Actuel | Nouveau |
|---------|--------|---------|
| Titre option (Preview) | `text-primary` (bleu) | Couleur par défaut (noir) |
| Titre option (Export) | `color: #2563eb` (bleu) | Pas de couleur (noir) |

### 2. Appliquer une couleur de fond à la carte

| Élément | Actuel | Nouveau |
|---------|--------|---------|
| Header carte (Preview) | `bg-muted` (gris) | `bg-primary/10` (bleu léger) |
| Header carte (Export) | `option-card` (gris) | `background-color: #dbeafe` (bleu léger) |

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Retirer `text-primary` du titre + changer `bg-muted` en `bg-primary/10` (ligne 874 et 877) |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Retirer `color: #2563eb` du titre + ajouter fond bleu clair à la carte (lignes 363 et 368) |

## Détail des modifications

### RentalProposalPreview.tsx (lignes 874-877)

```jsx
// AVANT
<div className="bg-muted px-3 py-1.5 flex items-center gap-2">
  <div className="h-3 w-3 border border-foreground/70 rounded-sm flex-shrink-0" />
  <span className="font-semibold text-[11px] text-primary">{option.name}</span>

// APRÈS
<div className="bg-primary/10 px-3 py-1.5 flex items-center gap-2">  // bg-muted → bg-primary/10
  <div className="h-3 w-3 border border-foreground/70 rounded-sm flex-shrink-0" />
  <span className="font-semibold text-[11px]">{option.name}</span>  // Retrait de text-primary
```

### RentalProposalExport.tsx (lignes 363-368)

```html
<!-- AVANT -->
<div class="option-card" style="margin-bottom: 6px;">
  ...
  <span style="font-weight: 600; font-size: 9px; color: #2563eb;">${opt.name}</span>

<!-- APRÈS -->
<div style="margin-bottom: 6px; background-color: #dbeafe; border-radius: 4px; padding: 6px;">
  ...
  <span style="font-weight: 600; font-size: 9px;">${opt.name}</span>  <!-- Retrait du color -->
```

## Résultat attendu

```text
Page 5 - Cartes Options avec fond coloré
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ Services Inclus          (fond gris)   │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-Tection              (fond gris)   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ⚙ Nos options                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-Optimisée       (fond BLEU CLAIR)  │ │ ← Carte colorée
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ Pro-maintenance     (fond BLEU CLAIR)  │ │ ← Carte colorée
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Points techniques

- La couleur `bg-primary/10` (#dbeafe) est un bleu très léger qui ressort subtilement sans être agressif
- Les titres restent noirs pour une meilleure lisibilité
- La cohérence WYSIWYG est maintenue entre Preview et Export
