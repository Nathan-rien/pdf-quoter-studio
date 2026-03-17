

## Plan : Garder "Votre offre" sur la même page quand il y a de la place

### Problème

La capacité estimée de la page 4 (`INVEST_LINES_PAGE1 = 22` lignes visuelles) est trop conservatrice. Le long texte de désignation occupe ~8-10 lignes visuelles, et avec le footer (~9 lignes), le total dépasse 22 alors que visuellement il y a largement la place sur la page.

### Correction (1 fichier)

**`src/lib/canvas-constants.ts`** — Augmenter la capacité de la première page et réduire légèrement la réserve du footer :

1. `INVEST_LINES_PAGE1` : 22 → **26** (la page peut contenir plus de lignes que l'estimation actuelle)
2. `INVEST_FOOTER_BASE_LINES` : 5 → **4** (le titre "Votre offre" + Avantages/Conditions prennent moins de place que estimé)
3. `INVEST_LINES_CONTINUATION` : 32 → **36** (cohérent avec l'augmentation)

Cela permet au système de garder "Votre offre" sur la même page que le tableau produits quand il reste de la place, tout en déportant sur une page dédiée quand le tableau est réellement trop long.

Le seuil `INVEST_SINGLE_PAGE_FOOTER_THRESHOLD` se recalculera automatiquement (`Math.floor(26/2) = 13`).

L'export PDF sera aussi impacté via le ratio `EXPORT_HEIGHT_RATIO` appliqué dans `RentalProposalExport.tsx`.

