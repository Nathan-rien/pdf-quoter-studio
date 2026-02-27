
✅ TERMINÉ — Affichage des options avec prix (mois/total) + scope (/machine|/parc) rétabli dans l'aperçu et le PDF.

Changements effectués :
1. `src/lib/options-price-utils.ts` — Helper partagé pour le libellé prix avec fallback
2. `src/components/rental-proposal/RentalProposalPreview.tsx` — Ciblage dynamique via `options_block`, filtre statiques, prix unifié
3. `src/components/rental-proposal/RentalProposalExport.tsx` — Page options dédiée dans le PDF avec toutes les nosOptions, checkbox, prix/scope + exclusion des statiques
