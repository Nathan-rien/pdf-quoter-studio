
## Corriger le seuil de declenchement de la page footer

### Cause racine

La condition actuelle pour creer une page footer dediee est :

```
lastChunk > limit - INVEST_FOOTER_RESERVED_LINES
// soit: lastChunk > 32 - 8 = 24
```

Cela signifie que si le dernier chunk contient exactement 24 lignes ou moins, le footer (totaux + "Votre offre" + propositions financieres + elements texte en flux) est force sur la meme page. Or, le footer reel occupe bien plus que 8 lignes d'espace visuel (il contient : bloc totaux, titre "Votre offre", N blocs de propositions financieres avec sous-lignes, plus les elements texte "Avantages" et "Conditions").

Deux corrections necessaires :

1. **Augmenter `INVEST_FOOTER_RESERVED_LINES`** de 8 a 14 pour refleter la taille reelle du footer (totaux + 2-3 blocs propositions + textes "Avantages"/"Conditions").

2. **Changer `>` en `>=`** dans la condition pour eviter le cas limite ou `lastChunk === limit - RESERVED` ne declenche pas la page dediee.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/lib/canvas-constants.ts` | `INVEST_FOOTER_RESERVED_LINES = 8` devient `14` |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | `lastChunk > limit` devient `lastChunk >= limit` |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme changement `>` en `>=` |

### Detail

Avec `INVEST_FOOTER_RESERVED_LINES = 14` :
- Seuil de declenchement : `32 - 14 = 18`
- Si le dernier chunk a 18 lignes ou plus, une page footer dediee est creee
- Si le dernier chunk a moins de 18 lignes, le footer tient sur la meme page (il reste 14+ lignes d'espace)

Cela garantit que le footer n'est jamais tronque en bas de page.
