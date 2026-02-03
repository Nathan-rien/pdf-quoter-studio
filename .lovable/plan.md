

# Plan : Restaurer l'extraction multi-lignes des désignations Dental

## Contexte

La modification précédente a simplifié l'extraction pour ne garder que la première ligne de description. L'utilisateur souhaite revenir à l'extraction complète multi-lignes pour avoir l'intégralité du texte descriptif.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/pdf-import-parser.ts` | Restaurer la boucle de collecte multi-lignes |

## Modification

Restaurer le code de collecte des lignes suivantes dans `parseDentalProductsWithMultilineDescriptions` (lignes 1339-1342) :

```typescript
// AVANT (version simplifiée actuelle) :
const designation = reference 
  ? `[${reference}] ${descriptionLine}` 
  : descriptionLine;

// APRÈS (restauration multi-lignes) :
const descriptionParts = [descriptionLine];

// Scan following lines until stop marker
let emptyLineCount = 0;
for (let j = i + 1; j < lines.length; j++) {
  const nextLine = lines[j];
  
  // Handle empty lines - allow a few but stop at consecutive empties
  if (!nextLine || nextLine.length < 2) {
    emptyLineCount++;
    if (emptyLineCount >= 2) break;
    continue;
  }
  emptyLineCount = 0;
  
  // Stop conditions
  if (stopMarkers.test(nextLine)) break;
  if (productLinePattern.test(nextLine)) break; // New product
  if (/^\[.*?\].*Unit[eé]/i.test(nextLine)) break; // New product with ref
  
  // Skip metadata/footer lines
  if (/^(SASU|IBAN|BIC|TVA|TEL|Capital|SIRET|RCS|Code\s*APE)/i.test(nextLine)) break;
  
  // Add to description
  descriptionParts.push(nextLine);
}

// Build final designation with reference prefix
const fullDescription = descriptionParts.join('\n').trim();
const designation = reference 
  ? `[${reference}] ${fullDescription}` 
  : fullDescription;
```

## Résultat attendu

### Produit 1 (désignation complète) :

```
[i900c 3YW fidelite] MEDIT i-Series : Scanner
IO (i900c garantie 3 ans fidélité)
Un ordinateur adapté doit être utilisé pour
le bon fonctionnement de ce matériel. Merci
de vous rapprocher de notre service technique.
Mises à jour du logiciel Medit Link gratuites.
Merci de conserver les emballages pour tout retour SAV...
```

### Produit 2 (désignation complète) :

```
[OF-CAB] Station de travail 3D fixe CAB
Inclus :
- Tour : carte graphique Nvidia RTX 5060 (8Go)
- processeur Intel Core I7 14eme Génération
- disque dur SSD 1To ; RAM 32 GB ; wifi
...
Garantie constructeur 2 ans.
```

