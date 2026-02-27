
Objectif: rétablir l’affichage des options avec prix (mois/total) + scope (/machine|/parc) de manière cohérente dans l’aperçu et dans le PDF.

1) Corriger le ciblage de la page “Nos options” dans l’aperçu
- Fichier: `src/components/rental-proposal/RentalProposalPreview.tsx`
- Remplacer le hardcode `realPageNum === 6` par un ciblage basé sur la zone dynamique:
  - `const optionsPageNum = getInjectionPageForZoneType('options_block') ?? 6`
  - rendre `renderNosOptionsPage(optionsPageNum)`
- Adapter `renderNosOptionsPage` pour recevoir `pageNum` et charger ses `staticElements` sur cette page.

2) Forcer un rendu dynamique visible (sans recouvrement template)
- Fichier: `src/components/rental-proposal/RentalProposalPreview.tsx`
- Sur la page options, exclure les éléments statiques parasites (textes/formes/icônes) qui masquent le contenu:
  - conserver uniquement les images de fond autorisées (ou image-only + exclusion ciblée).
- Rendre le bloc options en overlay stable (même approche que la signature) pour éviter les décalages liés aux offsets/scales de session.

3) Uniformiser la logique d’affichage du prix + scope
- Fichier: `src/components/rental-proposal/RentalProposalPreview.tsx` et `src/components/rental-proposal/RentalProposalExport.tsx`
- Extraire une logique commune de libellé prix:
  - mode `mensuel` => `xx,xx € / mois /machine|/parc`
  - mode `total` => `xx,xx € /machine|/parc`
  - fallback sûr si la valeur du mode choisi est vide (utiliser l’autre valeur disponible au lieu d’afficher vide).

4) Ajouter le rendu “Nos options” dédié dans le PDF
- Fichier: `src/components/rental-proposal/RentalProposalExport.tsx`
- Dans `generateDynamicContentByPage`, injecter un bloc dynamique sur `optionsPageNum` (zone `options_block` ou fallback 6) avec:
  - toutes les `nosOptions` (pas uniquement les sélectionnées),
  - état checkbox selon `option.selected`,
  - description formatée,
  - prix + scope selon la logique commune.
- Exclure les éléments statiques de cette page qui doublonnent/masquent la liste (via `excludeElementIds`).

5) Vérification fonctionnelle
- Aperçu:
  - la page options affiche bien les cases, le prix selon mode (mois/total) et le scope.
  - plus de rendu “ancien template” en recouvrement.
- Export PDF:
  - même rendu que l’aperçu sur la page options (WYSIWYG),
  - prix/scope identiques aux choix faits dans “Données > Nos Options”.

Section technique
- Cause observée: le PDF n’injecte pas de page options dédiée, et l’aperçu peut retomber sur/être recouvert par des éléments statiques de template.
- Fix structurel: page options pilotée par la zone `options_block` + rendu dynamique dédié dans les deux moteurs (preview/export) + exclusion explicite des statiques concurrents.
