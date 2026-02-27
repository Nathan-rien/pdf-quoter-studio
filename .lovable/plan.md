
Objectif: rétablir l’affichage de la ligne **“Total investissement”** sur la page 4 dans le PDF export, y compris quand la pagination crée une page “footer-only”.

1) Corriger le cas `[N, 0]` dans `src/components/rental-proposal/RentalProposalExport.tsx`
- Dans `generateDynamicContentByPage`, calculer un booléen dédié pour la page 4:
  - `isChunk0LastDataChunk = investChunksLocal[0] > 0 && (investChunkCount === 1 || investChunksLocal[1] === 0)`
- Remplacer la condition actuelle de rendu page 4:
  - Aujourd’hui: `!isMultiPage ? totalHTML + offreAndProposalsHTML : ''`
  - Cible:
    - rendre `totalHTML` si `isChunk0LastDataChunk`
    - rendre `offreAndProposalsHTML` uniquement si `!isMultiPage`

2) Garder la logique des pages de continuation mais sans régression
- Conserver le rendu du total sur continuation uniquement pour le dernier chunk contenant des données (`isLastDataChunk` avec `chunkLineCount > 0`)
- Conserver le rendu de `offreAndProposalsHTML` sur le dernier chunk (y compris page footer-only)

3) Ne pas modifier les constantes globales
- Garder la pagination export actuelle (`EXPORT_LINES_PAGE1`, `EXPORT_LINES_CONTINUATION`)
- Ne toucher ni `canvas-constants.ts` ni la preview

4) Validation ciblée après implémentation
- Cas A: `investChunksLocal = [N]` → total + offre sur page 4
- Cas B: `investChunksLocal = [N, 0]` → total sur page 4, offre sur page suivante
- Cas C: `investChunksLocal = [N, M]` ou `[N, M, 0]` → total sur dernier chunk data, offre sur dernière page
- Vérifier le PDF réel (pas seulement l’aperçu UI) avec le même dossier utilisateur

Détails techniques
- Cause exacte observée: le total est masqué non pas par absence de génération, mais par une condition de rendu incomplète: en mode multi-page, la page 4 n’affiche jamais `totalHTML`, et la boucle continuation n’affiche `totalHTML` que pour `chunkLineCount > 0`. Le scénario `[N, 0]` supprime donc le total partout.
