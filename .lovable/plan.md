

## Corriger la pagination du tableau investissements et le debordement

### Probleme constate
1. **Page 4** : Le tableau "Vos investissements" est coupe en bas -- les lignes depassent la zone visible avant le logo en bas a droite. Le seuil `INVEST_LINES_PAGE1 = 18` est trop eleve.
2. **Page de continuation (page 5)** : Le tableau continue correctement, mais les elements qui suivent (bloc "Total investissement", "Votre offre" avec les propositions financieres, et les textes "Avantages" / "Conditions de l'offre") sont tronques car le contenu total depasse la hauteur A4 disponible.

### Solution

Reduire le nombre de lignes par page et ajouter une logique de "debordement" pour les elements qui suivent le tableau : si le dernier chunk de lignes + les totaux + propositions + flow elements depassent la capacite de la page, une page supplementaire est automatiquement generee pour les elements restants.

### Modifications

#### 1. `src/lib/canvas-constants.ts`
- Reduire `INVEST_LINES_PAGE1` de 18 a **12** (la page 4 a des elements statiques au-dessus et le logo en bas a droite)
- Reduire `INVEST_LINES_CONTINUATION` de 28 a **22** (laisser de la marge pour le bloc total + propositions + flow elements sur le dernier chunk)
- Ajouter `INVEST_LINES_LAST_WITH_FOOTER = 14` : nombre max de lignes sur le dernier chunk quand il doit aussi afficher le total, propositions et flow elements. Si le dernier chunk depasse ce seuil, les elements "footer" (total + propositions + flow) sont repousses sur une page supplementaire.

#### 2. `src/components/rental-proposal/RentalProposalPreview.tsx`

**Ajuster le calcul des chunks :**
- Utiliser les nouvelles constantes (12 / 22)
- Ajouter une logique : si le dernier chunk a plus de `INVEST_LINES_LAST_WITH_FOOTER` lignes, creer un chunk supplementaire vide (0 lignes de tableau) qui ne contient que le total + propositions + flow elements
- Cela garantit que ces elements ne sont jamais tronques

**Concretement :**
- Apres le decoupage en chunks, verifier si le dernier chunk a plus de `INVEST_LINES_LAST_WITH_FOOTER` lignes
- Si oui, ajouter un chunk supplementaire vide (pas de lignes de tableau, juste le "footer")
- `extraInvestPages` est recalcule en consequence
- Le `isLastChunk` dans `renderProductPage` determine si on affiche ou non le bloc total/propositions/flow

#### 3. `src/components/rental-proposal/RentalProposalExport.tsx`

**Meme logique de debordement pour l'export PDF :**
- Appliquer la meme verification : si le dernier chunk depasse `INVEST_LINES_LAST_WITH_FOOTER`, generer une page supplementaire contenant uniquement `totalAndProposalsHTML` + `flowElementsHTML`
- Cette page est ajoutee au tableau `extraPages` dans `extraPagesAfter[4]`

### Resume des changements de constantes

| Constante | Avant | Apres | Role |
|---|---|---|---|
| `INVEST_LINES_PAGE1` | 18 | 12 | Lignes max sur la premiere page (page 4) |
| `INVEST_LINES_CONTINUATION` | 28 | 22 | Lignes max sur une page de continuation |
| `INVEST_LINES_LAST_WITH_FOOTER` | - | 14 | Seuil du dernier chunk au-dela duquel le footer passe sur une nouvelle page |

### Cas concrets

- **10 lignes** : 1 page (page 4), tout tient, aucun changement
- **15 lignes** : 2 pages (12 + 3). Page 5 : 3 lignes + total + propositions + flow. Tout tient.
- **30 lignes** : 3 pages (12 + 18). Page 6 (dernier chunk) : 18 lignes > 14 donc le footer passe sur une 4eme page.
- **35 lignes** : 3 pages de tableau (12 + 22 + 1) + 1 page footer si necessaire.

