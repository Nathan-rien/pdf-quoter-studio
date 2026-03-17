

## Plan : Augmenter la capacité de page pour garder "Votre offre" avec le tableau

### Diagnostic

Avec les constantes actuelles (`INVEST_LINES_PAGE1 = 26`), les deux produits à longues désignations totalisent ~20-22 lignes visuelles. Le footer (8 lignes) porte le total à ~28-30, dépassant la capacité de 26. Le footer est donc repoussé sur une page dédiée alors que visuellement il y a de la place.

### Correction (1 fichier)

**`src/lib/canvas-constants.ts`** — Augmenter les capacités de page :

- `INVEST_LINES_PAGE1` : 26 → **30** (la page A4 a plus d'espace vertical que l'estimation actuelle)
- `INVEST_LINES_CONTINUATION` : 36 → **40** (cohérent)

Le seuil `INVEST_SINGLE_PAGE_FOOTER_THRESHOLD` se recalculera automatiquement (`Math.floor(30/2) = 15`).

L'export PDF s'adaptera aussi via `EXPORT_HEIGHT_RATIO` dans `RentalProposalExport.tsx` (`Math.floor(30 * 0.892) ≈ 26`).

