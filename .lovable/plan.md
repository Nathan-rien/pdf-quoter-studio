

## Probleme

La pagination actuelle ne prend en compte que le nombre de lignes produit (`lignesData.length`) pour decider du decoupage en pages. Le bloc "Votre offre" (propositions financieres) + les elements en flux (Avantages, Conditions) + le commentaire sont toujours places sur le dernier chunk, sans verifier s'ils tiennent dans l'espace restant.

Avec 4 propositions comme dans la capture, ce bloc fait environ 20-24 "lignes equivalentes" alors que `INVEST_FOOTER_RESERVED_LINES = 9` n'en reserve que 9. Le contenu deborde de la page.

## Approche

Calculer dynamiquement le nombre de lignes equivalentes que le footer occupe en fonction du nombre de propositions, puis ajuster la capacite du dernier chunk de donnees pour que le footer ait assez de place. Si le footer seul depasse la capacite d'une page, il faut le decouper sur plusieurs pages.

## Modifications

### 1. `src/lib/canvas-constants.ts`

Ajouter une constante pour le nombre de lignes equivalentes par proposition :

```
// Lignes équivalentes par proposition dans "Votre offre" (titre + lignes de détail + marges)
export const INVEST_LINES_PER_PROPOSAL = 4;
// Lignes de base du footer (titre "Votre offre" + éléments flow + commentaire + marges)
export const INVEST_FOOTER_BASE_LINES = 5;
```

Remplacer `INVEST_FOOTER_RESERVED_LINES = 9` par un calcul dynamique base sur ces constantes.

### 2. `src/components/rental-proposal/RentalProposalPreview.tsx`

Dans le calcul de `investChunks` (lignes 191-207) :

- Calculer le nombre de lignes necessaires pour le footer : `footerLines = INVEST_FOOTER_BASE_LINES + proposals.length * INVEST_LINES_PER_PROPOSAL`
- Utiliser `footerLines` au lieu de `INVEST_FOOTER_RESERVED_LINES` pour determiner la capacite du dernier chunk
- Si `footerLines > INVEST_LINES_CONTINUATION` (le footer seul depasse une page), generer des chunks footer supplementaires (rare mais possible avec 8+ propositions)
- Ajuster `INVEST_SINGLE_PAGE_FOOTER_THRESHOLD` pour tenir compte du nombre de propositions : le seuil doit etre `INVEST_LINES_PAGE1 - footerLines`

Le chunk `0` (page footer-only) existant accueille deja le contenu "Votre offre". Il suffit de s'assurer que la capacite du dernier chunk de donnees laisse assez de place, et que le chunk `0` est ajoute des que le footer ne tient pas avec les donnees.

### 3. `src/components/rental-proposal/RentalProposalExport.tsx`

Meme logique dans `investChunksLocal` (lignes 384-401) :

- Calculer `footerLines` de la meme maniere
- Ajuster le seuil et les capacites en consequence
- Le HTML de `offreAndProposalsHTML` est deja correctement rendu sur le dernier chunk, donc pas de changement de structure

### Detail du calcul

```text
proposalCount = nombre de propositions (ex: 4)
footerLines = INVEST_FOOTER_BASE_LINES + proposalCount * INVEST_LINES_PER_PROPOSAL
            = 5 + 4 * 4 = 21

Cas single-page :
  seuil = INVEST_LINES_PAGE1 - footerLines = 22 - 21 = 1
  → Avec 6 lignes produit et 4 propositions, 6 > 1, donc on cree une page footer dediee

Cas multi-page :
  LAST_CHUNK_MAX = INVEST_LINES_CONTINUATION - footerLines
  Si footerLines > INVEST_LINES_CONTINUATION → chunk footer seul (0 lignes data)
```

### Impact

- Le rendu `isLastChunk` qui affiche "Votre offre" reste inchange (il continue a afficher les propositions sur le dernier chunk)
- Le nombre de pages supplementaires (`extraInvestPages`) augmente automatiquement quand le footer deborde
- Compatible avec 1 a N propositions sans risque de debordement

