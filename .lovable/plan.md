

# Plan : Ajouter un espace après le deux-points

## Problème identifié

Le texte "Total investissement :" n'a pas d'espace après le deux-points, ce qui donne "Total investissement :14 484,00 € HT" au lieu de "Total investissement : 14 480 € HT".

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Ajouter espace après le `:` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Vérifier/ajouter espace après le `:` |

## Détail des modifications

### 1. RentalProposalPreview.tsx (ligne 752)

```tsx
// AVANT
<span>Total investissement&nbsp;:</span>

// APRÈS
<span>Total investissement&nbsp;:&nbsp;</span>
```

L'ajout d'un `&nbsp;` (espace insécable) après le deux-points garantit l'espacement correct.

### 2. RentalProposalExport.tsx (ligne 315)

```html
<!-- AVANT -->
<span>Total investissement :</span>

<!-- APRÈS -->
<span>Total investissement :&nbsp;</span>
```

## Résultat attendu

| Avant | Après |
|-------|-------|
| Total investissement :14 484,00 € HT | Total investissement : 14 484,00 € HT |

## Point technique

L'utilisation de `&nbsp;` (espace insécable) est préférable à un simple espace car elle empêche le navigateur de "collapse" l'espace lors du rendu, garantissant ainsi un affichage cohérent dans l'aperçu et le PDF.

