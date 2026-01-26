

# Plan : Corriger l'extraction des totaux Cybertek

## Problème identifié

Dans le PDF Cybertek, les totaux (14 700,00 €, 2 940,00 €, 17 640,00 €) sont affichés **sans labels** dans la dernière colonne du tableau. Le parser actuel :

1. S'arrête à "Offre Locative" (`stopRe`) avant d'avoir vu les lignes de totaux
2. Les patterns de fallback cherchent des labels ("Total HT", "TVA 20%", "Total TTC") qui ne sont pas présents sur ces lignes

## Solution

Modifier la logique d'extraction des totaux dans `parseCybertekText()` pour :

1. **Chercher les 3 dernières lignes avec des montants significatifs** (après "Loyer mensuel")
2. **Valider la cohérence** : TTC ≈ HT + TVA et TVA ≈ HT × 0.20

### Fichier : `src/lib/pdf-import-parser.ts`

### Modification 1 : Améliorer l'extraction des totaux (lignes 326-386)

**Avant :** Le code cherche les montants >= 1000 € dans le "tail" du document, mais le filtre et la validation sont trop stricts.

**Après :** Ajouter une nouvelle stratégie spécifique pour Cybertek :

```typescript
// Après l'extraction des lignes produits (ligne ~325)

// Stratégie Cybertek : les 3 dernières lignes avec montants > 100 € 
// situées APRÈS "Loyer mensuel" sont probablement Total HT, TVA, TTC
const loyerIdx = lines.findIndex((l) => /Loyer\s+mensuel/i.test(l));
if (loyerIdx !== -1) {
  const afterLoyer = lines.slice(loyerIdx + 1);
  
  // Extraire tous les montants significatifs (> 100 €) après "Loyer mensuel"
  const amounts: number[] = [];
  for (const line of afterLoyer) {
    const matches = [...line.matchAll(new RegExp(`${money}\\s*€`, 'gi'))];
    for (const m of matches) {
      const v = parseNumber(m[1]);
      if (v !== null && v >= 100) amounts.push(v);
    }
  }
  
  // Prendre les 3 premiers montants significatifs comme HT, TVA, TTC
  if (amounts.length >= 3) {
    const [ht, tva, ttc] = amounts.slice(0, 3);
    
    // Validation : TTC devrait être proche de HT + TVA (tolérance 5%)
    const expectedTTC = ht + tva;
    if (Math.abs(ttc - expectedTTC) / expectedTTC < 0.05) {
      result.totaux!.totalHT = ht;
      result.totaux!.tva = tva;
      result.totaux!.totalTTC = ttc;
    }
  }
}
```

### Modification 2 : Ajuster le filtre de montants (ligne 344)

Le filtre actuel `>= 1000` exclut potentiellement certaines TVA. Changer en `>= 100` avec une validation plus intelligente basée sur la cohérence HT + TVA = TTC.

## Résultat attendu

| Donnée | Avant (probablement null) | Après |
|--------|---------------------------|-------|
| Total HT | null ou incorrect | 14 700,00 € |
| TVA 20% | null ou incorrect | 2 940,00 € |
| Total TTC | null ou incorrect | 17 640,00 € |

## Impact

- **Fichier modifié** : `src/lib/pdf-import-parser.ts`
- **Fonction modifiée** : `parseCybertekText()` (section extraction totaux)
- **Aucun impact sur** : Le parsing Grosbill (fonction séparée)
- **Rétrocompatibilité** : Les patterns existants restent en fallback

