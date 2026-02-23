

## Detecter le debordement de la page 4 et deporter le contenu sur une page supplementaire

### Probleme

Quand le tableau d'investissements contient suffisamment de lignes pour tenir sur une seule page (moins de 22 lignes) mais qu'il reste peu de place, les sections "Votre offre", "Avantages" et "Condition de l'offre" debordent en bas de page et sont tronquees.

### Solution

Introduire un seuil : si le nombre de lignes du tableau depasse un certain nombre (environ 13 lignes), le contenu de pied de page (offre, avantages, conditions, commentaire) est automatiquement reporte sur une page supplementaire dediee, meme si le tableau tient techniquement sur une seule page.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/lib/canvas-constants.ts` | Ajouter une constante `INVEST_LINES_SINGLE_PAGE_MAX` (seuil a partir duquel le footer est deporte sur une page dediee, meme en single-page) |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Modifier la logique de chunking pour creer une page footer dediee quand les lignes depassent le seuil, meme si elles tiennent en un seul chunk |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Appliquer la meme logique de debordement dans l'export PDF |

### Detail technique

**1. Nouvelle constante (`canvas-constants.ts`)**

```text
// Seuil en single-page : au-dela de ce nombre de lignes,
// le footer (Votre offre + Avantages + Conditions) est deporte sur une page dediee
export const INVEST_SINGLE_PAGE_FOOTER_THRESHOLD = 13;
```

**2. Logique de chunking modifiee (`RentalProposalPreview.tsx` et `RentalProposalExport.tsx`)**

Actuellement :
- Si `totalLines <= INVEST_LINES_PAGE1` (22) : un seul chunk, tout sur une page
- Sinon : multi-page avec page footer dediee

Nouvelle logique :
- Si `totalLines <= INVEST_SINGLE_PAGE_FOOTER_THRESHOLD` (13) : un seul chunk, tout sur une page (assez de place)
- Si `totalLines <= INVEST_LINES_PAGE1` (22) : un seul chunk pour les donnees + un chunk vide (0) pour le footer sur une page dediee
- Sinon : logique multi-page existante (inchangee)

En concret, dans les deux fichiers, la fonction de chunking devient :

```text
const investChunks = (() => {
  const totalLines = lignesData.length;
  if (totalLines <= INVEST_SINGLE_PAGE_FOOTER_THRESHOLD) return [totalLines];
  if (totalLines <= INVEST_LINES_PAGE1) {
    // Le tableau tient sur une page mais pas assez de place pour le footer
    // -> reporter le footer sur une page dediee
    return [totalLines, 0];
  }
  const chunks = [INVEST_LINES_PAGE1];
  let remaining = totalLines - INVEST_LINES_PAGE1;
  while (remaining > 0) {
    chunks.push(Math.min(remaining, INVEST_LINES_CONTINUATION));
    remaining -= INVEST_LINES_CONTINUATION;
  }
  chunks.push(0);
  return chunks;
})();
```

La variable `isMultiPage` existante (et les conditions `isLastChunk`, `isLastDataChunk`) fonctionnent deja correctement car elles se basent sur `investChunks.length > 1`, ce qui sera vrai des que le footer est deporte. Aucune autre modification logique n'est necessaire.

### Ce qui ne change pas

- Le rendu du tableau de produits
- Le rendu des elements en flux (Avantages, Conditions, Commentaire)
- La logique de pagination multi-page existante (plus de 22 lignes)
- Les autres pages du template

