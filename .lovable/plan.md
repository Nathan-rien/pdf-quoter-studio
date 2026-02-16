
## Toujours separer le footer du tableau sur une page dediee en multi-page

### Probleme
Quand le tableau "Vos investissements" s'etend sur plusieurs pages, les elements qui suivent (Total, "Votre offre", propositions financieres, textes "Avantages/Conditions") sont colles en bas de la derniere page du tableau et se retrouvent tronques. Le seuil `INVEST_LINES_LAST_WITH_FOOTER` ne suffit pas a prevenir ce debordement.

### Solution
Simplifier la logique : des que le tableau depasse la page 4 (multi-page), **toujours** ajouter une page dediee pour le footer (Total + Votre offre + flow elements). On supprime le seuil conditionnel `INVEST_LINES_LAST_WITH_FOOTER`.

### Modifications

#### 1. `src/lib/canvas-constants.ts`
- Supprimer `INVEST_LINES_LAST_WITH_FOOTER` (plus utilise)

#### 2. `src/components/rental-proposal/RentalProposalPreview.tsx` (lignes 179-194)
Remplacer la logique conditionnelle par :
```typescript
const investChunks = (() => {
  const totalLines = lignesData.length;
  if (totalLines <= INVEST_LINES_PAGE1) return [totalLines];
  const chunks = [INVEST_LINES_PAGE1];
  let remaining = totalLines - INVEST_LINES_PAGE1;
  while (remaining > 0) {
    chunks.push(Math.min(remaining, INVEST_LINES_CONTINUATION));
    remaining -= INVEST_LINES_CONTINUATION;
  }
  // Multi-page : toujours ajouter un chunk vide dedie au footer
  chunks.push(0);
  return chunks;
})();
```

#### 3. `src/components/rental-proposal/RentalProposalExport.tsx` (lignes 295-310)
Meme changement :
```typescript
const investChunksLocal: number[] = (() => {
  const totalLines = lignesData.length;
  if (totalLines <= INVEST_LINES_PAGE1) return [totalLines];
  const chunks = [INVEST_LINES_PAGE1];
  let remaining = totalLines - INVEST_LINES_PAGE1;
  while (remaining > 0) {
    chunks.push(Math.min(remaining, INVEST_LINES_CONTINUATION));
    remaining -= INVEST_LINES_CONTINUATION;
  }
  // Multi-page : toujours ajouter un chunk vide dedie au footer
  chunks.push(0);
  return chunks;
})();
```

### Resultat
- **Cas mono-page** (lignes <= 22) : inchange, tout sur la page 4
- **Cas multi-page** : le tableau utilise pleinement chaque page, puis une page supplementaire affiche proprement le Total, "Votre offre", propositions et textes de conditions sans troncature
