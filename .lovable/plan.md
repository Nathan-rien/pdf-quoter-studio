
Objectif: corriger définitivement le positionnement de la zone de signature sur la dernière page, à la fois dans l’aperçu et dans le PDF, sans chevauchement avec “Important”.

1) Centraliser le calcul de position (source unique)
- Fichier: `src/lib/template-render-utils.ts`
- Ajouter une fonction utilitaire dédiée (ex: `computeSignatureBoxLayout`) qui calcule la position verticale depuis les éléments statiques de la dernière page:
  - repérer `Signature et cachet` (id ou texte),
  - repérer `Important : ...` (id ou texte),
  - optionnellement repérer `signature_zone` si présent.
- La fonction renverra un layout prêt à l’emploi pour les deux moteurs:
  - `leftPercent` = `8`
  - `widthPercent` = `84`
  - `topPercent` calculé depuis le repère “Signature et cachet”
  - `heightPx` ajustée pour rester strictement au-dessus du bloc “Important” (avec marge de sécurité).

2) Corriger l’aperçu (éviter les décalages de transform)
- Fichier: `src/components/rental-proposal/RentalProposalPreview.tsx`
- Dans `renderBonPourAccordPage`:
  - utiliser le layout calculé par l’utilitaire commun,
  - rendre la zone via `renderOverlayContent` (et non `renderDynamicContent`) pour qu’elle ne subisse plus `dynamicContentOffsets`/scale.
- Garder uniquement la zone de signature (pas de cases options).

3) Corriger l’export PDF (même calcul que l’aperçu)
- Fichier: `src/components/rental-proposal/RentalProposalExport.tsx`
- Dans `generateDynamicContentByPage`:
  - récupérer les éléments statiques de la dernière page (`latestVersion.pages[...]`),
  - utiliser le même utilitaire `computeSignatureBoxLayout`,
  - injecter le `<div>` signature avec:
    - `position:absolute`
    - `left/top/width` issus du layout
    - `height` fixe calculée (pas `min-height`)
    - bordure pointillée conservée.
- Supprimer toute valeur hardcodée `top: 28%` / `min-height: 120px`.

4) Garde-fous de fallback
- Si les repères texte ne sont pas trouvés, fallback sûr:
  - `topPercent: 22`
  - `heightPx: 100`
- Toujours borner la hauteur pour ne jamais dépasser le début du bloc “Important”.

5) Vérification après implémentation
- Aperçu:
  - la zone commence sous “Signature et cachet”,
  - ne recouvre ni le titre ni “Le / /”,
  - ne touche pas le bloc “Important”.
- Export PDF:
  - même alignement visuel que l’aperçu sur la dernière page,
  - aucun chevauchement constaté, y compris quand la proposition comporte des pages supplémentaires (ex: 9/9).

Section technique (détails)
- Problème actuel: position hardcodée + rendu preview dans le wrapper dynamique transformable.
- Correctif structurel: calcul unique piloté par les éléments statiques réels du template + rendu overlay en preview.
- Bénéfice: cohérence WYSIWYG preview/export et robustesse si le template bouge.
