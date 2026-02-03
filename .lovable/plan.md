

# Plan : Garder uniquement la première ligne des désignations Dental

## Changement demandé

Actuellement, le parser collecte toutes les lignes de description jusqu'au marqueur de fin, ce qui donne des désignations très longues sur plusieurs lignes.

**Comportement actuel :**
```
[i900c 3YW fidelite] MEDIT i-Series : Scanner
IO (i900c garantie 3 ans fidélité)
Un ordinateur adapté doit être utilisé pour...
... (10+ lignes)
```

**Comportement souhaité :**
```
[i900c 3YW fidelite] MEDIT i-Series : Scanner
```

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-import-parser.ts` | Supprimer la boucle de collecte multi-lignes |

## Modification

Dans la fonction `parseDentalProductsWithMultilineDescriptions`, supprimer la boucle qui collecte les lignes suivantes (lignes 1344-1371) et utiliser uniquement la première ligne de description :

```typescript
// AVANT (lignes 1339-1377) :
const descriptionParts = [descriptionLine];

// Scan following lines until stop marker
let emptyLineCount = 0;
for (let j = i + 1; j < lines.length; j++) {
  const nextLine = lines[j];
  // ... (30 lignes de code de collecte multi-lignes)
  descriptionParts.push(nextLine);
}

const fullDescription = descriptionParts.join('\n').trim();
const designation = reference 
  ? `[${reference}] ${fullDescription}` 
  : fullDescription;

// APRÈS :
// Utiliser uniquement la première ligne de description
const designation = reference 
  ? `[${reference}] ${descriptionLine}` 
  : descriptionLine;
```

## Résultat attendu

| Désignation | Nb | VUN | VTN |
|-------------|-----|-----|-----|
| [i900c 3YW fidelite] MEDIT i-Series : Scanner | 1 | 11 000 | 11 000,00 € |
| [OF-CAB] Station de travail 3D fixe CAB | 1 | 1 666 | 1 666,00 € |

