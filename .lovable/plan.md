

## Séparer "Votre offre" du tableau Investissements en multi-page

### Problème

Actuellement, le bloc "Total investissement", "Votre offre", les propositions financières et les éléments texte (Avantages, Conditions) sont rendus dans le **même conteneur** que le dernier chunk de données du tableau. Quand le tableau remplit la majorité de la page, ces éléments débordent en bas et sont tronqués.

Le mécanisme `INVEST_FOOTER_RESERVED_LINES` tente de prédire si le footer tiendra, mais cette estimation en "lignes équivalentes" est imprécise car le footer contient des éléments de hauteur variable (propositions financières multiples, textes longs).

### Solution

Changer l'approche : **en mode multi-page, le footer (Total + Votre offre + propositions + Avantages + Conditions) va toujours sur une page dédiée.**

En mode single-page (tout tient sur la page 4), le comportement reste inchangé : tout s'affiche sur la même page.

Concrètement :
- Quand `investChunks.length > 1` (multi-page), on ajoute systématiquement `chunks.push(0)` pour créer une page dédiée au footer
- Le footer n'est rendu que sur cette page dédiée (chunk avec 0 lignes de données)
- Les pages de données intermédiaires n'affichent que le tableau, sans footer

### Detail technique

**Logique de chunking simplifiée** (dans les deux fichiers Preview + Export) :

```
Si totalLines > INVEST_LINES_PAGE1 :
  -> mode multi-page
  -> découper en chunks [22, 32, 32, ...]
  -> TOUJOURS ajouter chunks.push(0) pour la page footer
```

Cela supprime la logique conditionnelle fragile basée sur `INVEST_FOOTER_RESERVED_LINES`.

**Rendu** : la condition `isLastChunk` reste identique et fonctionne correctement puisque le dernier chunk (0 lignes) affichera uniquement le footer.

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Remplacer la condition `if (lastChunk > limit - FOOTER_RESERVED)` par un simple `chunks.push(0)` inconditionnel en multi-page |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Même modification |
| `src/lib/canvas-constants.ts` | La constante `INVEST_FOOTER_RESERVED_LINES` reste en place comme référence mais n'est plus utilisée pour le calcul de chunking |

### Comportement attendu

- Avec ~45 lignes : chunks = [22, 23, 0] -> Page 4 (22 lignes), Page 5 (23 lignes), Page 6 (footer seul : Total + Votre offre + Avantages + Conditions)
- Avec 20 lignes : chunks = [20] -> tout sur une seule page (pas de multi-page)
- Avec 55 lignes : chunks = [22, 32, 1, 0] -> Page 4, Page 5, Page 6 (1 ligne), Page 7 (footer)

