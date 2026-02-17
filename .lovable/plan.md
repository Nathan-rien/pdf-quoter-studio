

## Corriger la ligne "Total investissement" tronquee sur les pages de continuation

### Probleme

Le conteneur `.page` dans le PDF a une hauteur fixe (`PDF_BASE_HEIGHT`) avec `overflow: hidden`. La logique de decoupe alloue jusqu'a `INVEST_LINES_CONTINUATION` (32) lignes par page de continuation. Quand le dernier chunk de donnees contient beaucoup de lignes, le total qui est ajoute apres le tableau depasse la hauteur de la page et est tronque par `overflow: hidden`.

La preview (Apercu) n'a pas ce probleme car elle utilise un layout qui s'adapte au contenu.

### Cause racine

Dans `RentalProposalExport.tsx` (lignes 295-307), le decoupage en chunks ne reserve pas d'espace pour le "Total investissement" sur le dernier chunk contenant des donnees :

```text
chunks = [22, 32, 0]  -- 32 lignes + total = debordement
```

### Solution

Reduire la capacite du dernier chunk de donnees pour laisser de la place au bloc "Total investissement". La constante `INVEST_FOOTER_RESERVED_LINES` (9) existe deja mais n'est pas utilisee pour ce cas.

Apres la boucle de decoupe, verifier si le dernier chunk de donnees (avant le `0` du footer) atteint la capacite maximale. Si oui, deplacer quelques lignes vers un nouveau chunk pour laisser de l'espace au total.

### Fichier modifie

| Fichier | Lignes | Modification |
|---|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` | 295-307 | Ajuster la logique de decoupe pour reduire le dernier chunk de donnees et garantir que le total est visible |

### Logique corrigee

```text
// Nombre de lignes a reserver sur le dernier chunk pour le total
const TOTAL_RESERVED = 2;
const LAST_CHUNK_MAX = INVEST_LINES_CONTINUATION - TOTAL_RESERVED;

// Construction des chunks
chunks = [INVEST_LINES_PAGE1];
remaining = totalLines - INVEST_LINES_PAGE1;

while (remaining > LAST_CHUNK_MAX) {
  chunks.push(INVEST_LINES_CONTINUATION);
  remaining -= INVEST_LINES_CONTINUATION;
}
// Le dernier chunk avec donnees : toujours <= LAST_CHUNK_MAX
chunks.push(remaining);
// Page footer dediee (Votre offre, propositions)
chunks.push(0);
```

Avec cette logique, le dernier chunk de donnees n'excede jamais `INVEST_LINES_CONTINUATION - 2`, ce qui laisse suffisamment de place pour le bloc "Total investissement" sans debordement.

### Comportement attendu

- Le "Total investissement" est toujours visible sur la derniere page contenant des lignes de produits
- Aucun changement sur les pages de continuation intermediaires (elles gardent 32 lignes max)
- Si le dernier chunk deborderait, les lignes excedentaires sont reportees sur une page supplementaire

