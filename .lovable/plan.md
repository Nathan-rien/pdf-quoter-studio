

# Plan : Corriger la détection de la ligne Installation et les fusions incorrectes

## Problème identifié

### Cause racine 1 : Installation disparaît
Dans le code actuel (lignes 365-408), quand aucun candidat valide n'est trouvé (`bestCandidate === null`), le code fait simplement `continue` sans ajouter la ligne au résultat. C'est pourquoi "Installation" disparaît complètement.

Le problème sous-jacent : le pattern `lineEndPattern` cherche un format strict "QTE (1-2 chiffres) + montant + €" en fin de ligne, mais dans le texte extrait du PDF Cybertek, ce format n'est pas respecté pour les lignes services.

### Cause racine 2 : Lignes produits fusionnées (3ème ligne corrompue)
La ligne 3 dans l'app combine "Chassis d'extension..." avec "Synology Kit Rails..." car le parser ne détecte pas correctement les frontières entre produits lors du scan arrière (`findSyRefIndexBackwards`).

---

## Modifications requises

### Fichier : `src/lib/pdf-import-parser.ts`

### Modification 1 : Améliorer la détection pour les lignes services

**Problème** : Le pattern actuel cherche "QTE montant €" à la fin d'une ligne unique, mais le PDF peut avoir :
- "Installation" sur une ligne
- "Prestation d'installation..." sur une autre ligne
- "2 974,00 €" possiblement splitté ou formaté différemment

**Solution** : Utiliser une stratégie de "lookahead avec extraction séparée" :

```typescript
// Dans la boucle de lookahead (lignes 316-346)
// Au lieu de chercher "QTE montant €" sur UNE ligne,
// chercher le pattern de fin de tableau Cybertek qui est :
// - un nombre seul (QTE) sur une ligne ou en fin de texte
// - suivi d'un montant "XXX,XX €"

// Pattern plus flexible pour Cybertek :
// Cherche "QTE montant €" avec possibilité que QTE soit seul avant
const strictLineEndPattern = /(?:^|\s)(\d{1,2})\s+([\d\s,.]+)\s*€\s*$/;
```

Mais surtout, **ajouter un fallback** quand aucun candidat n'est trouvé :
- Chercher un montant seul (sans QTE explicite) et utiliser QTE=1 par défaut
- Ou scanner plus largement avec un pattern moins strict

### Modification 2 : Fallback quand bestCandidate est null

Actuellement, si aucun candidat n'est trouvé, la ligne Installation est simplement ignorée. Il faut ajouter :

```typescript
if (bestCandidate) {
  // ... existing code ...
} else {
  // FALLBACK: Essayer une extraction plus permissive
  // Chercher n'importe quel montant dans la fenêtre
  // Utiliser QTE=1 par défaut si non détecté
  
  // Collecter toutes les lignes de désignation jusqu'au prochain bloc
  const designationLines: string[] = [];
  let fallbackTotal = 0;
  let fallbackQty = 1;
  
  for (let j = i; j < rowsSource.length && j <= i + maxLookahead; j++) {
    const line = rowsSource[j];
    if (isNewBlockStart(line) && j > i) break;
    
    // Chercher un montant €
    const amountMatch = line.match(/([\d\s,.]+)\s*€/);
    if (amountMatch) {
      const val = parseNumber(amountMatch[1]);
      if (val && val > 100 && val < 10000) {
        fallbackTotal = val;
        // Chercher un QTE juste avant le montant
        const qtyBeforeAmount = line.match(/\s(\d{1,2})\s+[\d\s,.]+\s*€/);
        if (qtyBeforeAmount) {
          fallbackQty = parseInt(qtyBeforeAmount[1], 10) || 1;
        }
        break;
      }
    }
    
    // Collecter pour la désignation
    if (!isBannedLine(line) && !isGarantieLine(line)) {
      designationLines.push(line);
    }
  }
  
  if (fallbackTotal > 0) {
    // Construire et ajouter la ligne
    const designation = designationLines.join(' ')
      .replace(new RegExp(`^${specialRefMatch}\\s*`, 'i'), '')
      .replace(/[\d\s,.]+\s*€.*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    result.lignes!.push({
      reference: specialRefMatch,
      designation,
      quantite: fallbackQty,
      totalHT: fallbackTotal,
      prixUnitaire: fallbackQty > 0 ? Math.round((fallbackTotal / fallbackQty) * 100) / 100 : null,
    });
  }
}
```

### Modification 3 : Corriger les frontières produits (éviter les fusions)

Le problème de la ligne 3 fusionnée vient de `findSyRefIndexBackwards` qui remonte trop loin. Il faut ajouter une condition d'arrêt supplémentaire :

```typescript
const findSyRefIndexBackwards = (fromIdx: number) => {
  for (let j = fromIdx; j >= 0 && j >= fromIdx - 8; j--) {
    const v = rowsSource[j];
    if (syRefPattern.test(v)) return j;
    if (stopRe.test(v)) break;
    // AJOUT : s'arrêter si on voit un autre pattern de fin de ligne (€)
    // car ça signifie qu'on a traversé un autre produit
    if (/[\d\s,.]+\s*€\s*$/.test(v)) break;
  }
  return -1;
};
```

---

## Résumé des changements

| Ligne | Modification |
|-------|--------------|
| 265-267 | Ajouter condition d'arrêt dans `findSyRefIndexBackwards` |
| 364-408 | Ajouter bloc `else` avec extraction fallback pour les services |
| 303-346 | Améliorer les patterns de détection pour être moins stricts |

## Résultat attendu

| Donnée | Avant | Après |
|--------|-------|-------|
| **Ligne Installation** | Absente ❌ | Présente avec Nb=2, VTN=974,00 € ✓ |
| **Ligne Frais de livraison** | Absente ❌ | Présente avec VTN=0,00 € ✓ |
| **Ligne 3 (Kit Rails)** | Fusionnée avec Chassis ❌ | Séparée correctement ✓ |
| **Total lignes** | 4 | 6 (comme le PDF) |

---

## Impact technique

- **Fichier modifié** : `src/lib/pdf-import-parser.ts`
- **Fonctions modifiées** : 
  - `findSyRefIndexBackwards` : meilleure détection des frontières
  - Boucle principale : fallback pour services sans pattern strict
- **Rétrocompatibilité** : Les produits standards (SY-XXX) ne sont pas affectés

