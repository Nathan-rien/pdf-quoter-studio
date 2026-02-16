
## Dissocier "Total investissement" de "Votre offre" en multi-page

### Probleme

Actuellement, `isLastChunk` controle l'affichage du bloc entier : "Total investissement" + "Votre offre" + propositions + Avantages + Conditions. En multi-page avec `chunks.push(0)`, le dernier chunk a 0 lignes de donnees, donc tout ce bloc s'affiche sur la page dediee (Page 6). La ligne "Total investissement" devrait rester en bas de la derniere page de donnees (Page 5), pas sur la page suivante.

### Solution

Introduire un nouveau concept `isLastDataChunk` (derniere page contenant des lignes de tableau) en plus de `isLastChunk` (derniere page absolue). Repartir le contenu ainsi :

- **`isLastDataChunk`** : affiche "Total investissement" immediatement apres le tableau
- **`isLastChunk`** : affiche "Votre offre" + propositions financieres + elements texte (Avantages, Conditions)

En mode single-page (pas de multi-page), les deux flags sont vrais sur la meme page, donc aucun changement de comportement.

### Detail technique

**Nouveau flag** (dans les deux fichiers Preview + Export) :

```text
isLastChunk = chunkIndex >= investChunkCount - 1  (inchange)
isLastDataChunk = chunkIndex === investChunkCount - 2  (en multi-page)
                  OU chunkIndex === 0 (en single-page, un seul chunk)
```

Plus simplement : `isLastDataChunk` est vrai quand `pageLines.length > 0` et le chunk suivant (ou lui-meme) est le dernier.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | (1) Ajouter `isLastDataChunk` flag. (2) Deplacer "Total investissement" sous la condition `isLastDataChunk`. (3) Garder "Votre offre" + propositions + flow elements sous `isLastChunk` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | (1) Scinder `totalAndProposalsHTML` en `totalHTML` et `offreAndProposalsHTML`. (2) `totalHTML` rendu sur le dernier chunk avec donnees. (3) `offreAndProposalsHTML` rendu sur le dernier chunk (page dediee) |

### Preview - Code cible (lignes 670-850)

```typescript
const isLastChunk = chunkIndex >= investChunkCount - 1;
const isLastDataChunk = pageLines.length > 0 && 
  (chunkIndex === investChunkCount - 1 || investChunks[chunkIndex + 1] === 0);
```

Le rendu dans `renderProductTableWithFlowElements` :

```text
{pageLines.length > 0 && ( <tableau> )}

{isLastDataChunk && ( <Total investissement> )}

{isLastChunk && (
  <Votre offre>
  <Propositions financieres>
  <Elements texte Avantages/Conditions>
)}
```

### Export - Code cible (lignes 364-420)

Scinder le HTML en deux variables :

```text
totalHTML = "Total investissement : XX € HT"
offreAndProposalsHTML = "Votre offre" + propositions + flowElements
```

Puis dans la boucle de chunks :
- Sur le dernier chunk avec donnees (`chunkLineCount > 0` et chunk suivant = 0 ou dernier) : ajouter `totalHTML`
- Sur le dernier chunk absolu (`isLastChunk`) : ajouter `offreAndProposalsHTML`

En single-page : les deux sont rendus ensemble (pas de changement visible).

### Comportement attendu

Avec 45 lignes -> chunks = [22, 23, 0] :
- Page 4 : 22 lignes de tableau
- Page 5 : 23 lignes de tableau + "Total investissement : 92 880,54 EUR HT"
- Page 6 : "Votre offre" + Location 36 mois + Avantages + Conditions

Avec 20 lignes -> chunks = [20] :
- Page 4 : 20 lignes + Total + Votre offre + tout (inchange, single-page)
