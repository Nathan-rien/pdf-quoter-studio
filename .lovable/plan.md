

## Problème

Les parties de description des produits Dental sont jointes avec un **espace** (`dedupedParts.join(' ')`) au lieu d'un **retour à la ligne** (`\n`). Le texte apparaît donc en un seul bloc continu dans la colonne Désignation, alors que sur le PDF source chaque élément (nom produit, specs, garantie, notes) est sur une ligne séparée.

## Correction — `src/lib/pdf-import-parser.ts`

### 1. Joindre avec `\n` au lieu de `' '`

**Ligne 1685** — dans `parseDentalProductsWithMultilineDescriptions` :
```typescript
// AVANT
let fullDescription = removeRepeatedSubstrings(dedupedParts.join(' ').replace(/\s+/g, ' ').trim());

// APRÈS  
let fullDescription = removeRepeatedSubstrings(dedupedParts.join('\n').trim());
```

Le `\n` préserve la structure en lignes séparées. On supprime le `.replace(/\s+/g, ' ')` global qui écrasait les retours à la ligne en espaces.

### 2. Idem pour le parser Dental simple (ligne 1466)

```typescript
// AVANT
const designation = descriptionParts.join(' ').replace(/\s+/g, ' ')...

// APRÈS
const designation = descriptionParts.join('\n')
  .replace(/\d+[,.]?\d*\s*$/, '').trim();
```

### Affichage

L'onglet Invest utilise `EditableTable` avec `type: 'text'` pour la colonne désignation. La cellule en mode lecture utilise déjà un `<textarea>` ou un `<span>` — il faudra s'assurer que le CSS `whitespace-pre-wrap` est appliqué sur les cellules texte de l'`EditableTable` pour que les `\n` soient rendus visuellement. L'aperçu PDF applique déjà `whitespace-pre-wrap` sur la colonne Désignation.

### Résultat attendu

Chaque bloc de description sera affiché avec des retours à la ligne, fidèle à la mise en forme du devis PDF source.

