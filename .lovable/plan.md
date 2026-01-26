

# Plan : Exclure le logo du flux relatif

## Problème identifié

Le logo (élément de type `image`) positionné en bas à droite (`y: 839px`) est actuellement inclus dans le groupe `elementsBelow` et rendu en flux relatif avec les textes "Avantages" et "Conditions". Il devrait rester à sa position absolue fixe en bas à droite de la page.

## Cause racine

Le filtre de partition actuel :
```typescript
const elementsBelow = staticElements
  .filter(el => el.position.y >= dynamicZoneBottomY)
```

...ne distingue pas les éléments de contenu (texte) des éléments de mise en page fixe (logos, formes décoratives).

## Solution

Modifier le filtre pour **exclure les éléments de type `image`** (logos) du groupe `elementsBelow`. Les logos resteront dans le groupe "au-dessus" et seront rendus avec leur position absolue définie dans le template.

## Modification prévue

**Fichier** : `src/components/rental-proposal/RentalProposalPreview.tsx`

**Ligne ~654-656** - Modifier le filtre `elementsBelow` :

```typescript
// AVANT
const elementsBelow = staticElements
  .filter(el => el.position.y >= dynamicZoneBottomY)
  .sort((a, b) => a.position.y - b.position.y);

// APRÈS  
const elementsBelow = staticElements
  .filter(el => 
    el.position.y >= dynamicZoneBottomY && 
    el.type === 'text' // Seuls les textes suivent le flux
  )
  .sort((a, b) => a.position.y - b.position.y);
```

**Ligne ~653** - Modifier le filtre `elementsAbove` pour inclure les images/logos :

```typescript
// AVANT
const elementsAbove = staticElements.filter(el => el.position.y < dynamicZoneBottomY);

// APRÈS
const elementsAbove = staticElements.filter(el => 
  el.position.y < dynamicZoneBottomY || 
  el.type === 'image' // Les logos restent toujours en position absolue
);
```

## Résultat attendu

| Élément | Position actuelle | Position corrigée |
|---------|-------------------|-------------------|
| Titre "Votre offre" | Absolue (haut) | Absolue ✓ |
| Tableau Invest | Flux | Flux ✓ |
| Totaux | Flux (après tableau) | Flux ✓ |
| "Avantages" | Flux (après totaux) | Flux ✓ |
| "Conditions" | Flux (après Avantages) | Flux ✓ |
| **Logo Cybertek** | ~~Flux~~ | **Absolue (bas droite)** ✓ |

## Schéma visuel

```text
┌────────────────────────────────────────┐
│  Titre "Votre offre"     [abs]         │
├────────────────────────────────────────┤
│  ┌────────────────────────────────┐    │
│  │  Tableau Invest (dynamique)    │    │
│  │  - Produit 1                   │    │
│  │  - Produit 2                   │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │  Totaux                        │    │
│  └────────────────────────────────┘    │
│                                        │
│  Avantages :                  [flow]   │
│  • Point 1                             │
│                                        │
│  Condition de l'offre :       [flow]   │
│  • Condition 1                         │
│                                        │
│                             [LOGO]     │  ← Position absolue (bas droite)
├────────────────────────────────────────┤
│  Page 4/8                              │
└────────────────────────────────────────┘
```

## Considérations

- Cette modification s'applique uniquement à la Page 4 (produits)
- Les éléments de type `shape` (formes décoratives) pourraient aussi être exclus du flux si nécessaire
- Les icônes (`icon`) pourraient également être considérées comme des éléments fixes

