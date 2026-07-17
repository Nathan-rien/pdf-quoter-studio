## Diagnostic

### 1. Pourquoi seulement 3 pages ?
`ServiceProposalPreview` est appelé avec `mode="devis"` par défaut. Le filtre `scopeMatches` masque toutes les pages `documentScope: "contrat"`. Or dans le seed actuel :
- Pages 1, 2, 3 → `"both"` (visibles en devis) ✅
- Pages 4 à 9 → `"contrat"` (masquées en aperçu devis) → invisibles ici

C'est le comportement voulu (le devis ne montre pas les CG), mais rien dans l'UI ne permet à l'utilisateur de basculer en vue "contrat" pour vérifier les 9 pages avant validation.

### 2. Pourquoi ça se chevauche (page 1 et 2)
Le seed positionne les libellés statiques (`Bénéficiaire`, `Sites d'intervention`, `Contact opérationnel`, `Prestataires extérieurs`, `Résumé des services souscrits`, `Modalités de règlement`) à des coordonnées `y` fixes en pixels, alors que le rendu des zones dynamiques a son propre flux (chaque zone occupe une bande en % de la page). Les blocs dynamiques s'affichent à leurs positions et écrasent/décalent les libellés → superpositions visibles :
- Page 1 : "B / S / C / P" empilés en colonne à gauche, contenus dynamiques dessus
- Page 2 : le titre "Résumé des services souscrits" est superposé à la zone `options_summary`

## Correctifs à appliquer

### A. Aperçu — permettre de voir les 9 pages
Ajouter un sélecteur (segmented control) dans `ServiceProposalPreview.tsx` : `Devis` / `Contrat`. Il pilote l'état `mode` local (initialisé sur la prop). Le compteur "X pages" reflète le mode courant. Aucune autre logique ne change, l'export continue d'utiliser `mode="devis"` / `mode="contrat"` comme aujourd'hui.

### B. Seed — page 1 (Couverture)
Restructurer pour que chaque libellé précède immédiatement sa zone dynamique, sans chevauchement :
- Retirer les 4 libellés statiques placés en dur (`p1c-lbl-benef`, `-sites`, `-op`, `-prest`)
- Intégrer le libellé dans la `description` de chaque zone dynamique (le renderer de zone affiche déjà un titre), ou ajouter des `textEl` alignés sur le `top` calculé de chaque zone (`top` en % de la zone utile → y en px)
- Ré-espacer les 4 zones dynamiques verticalement de façon non chevauchante : bénéficiaire (top 10 / h 18), sites (top 30 / h 20), contact op (top 52 / h 16), prestataires (top 70 / h 22)

### C. Seed — page 2 (Périmètre)
- Remonter le libellé `Résumé des services souscrits` (`p2p-lbl-summary`) au-dessus de la zone `options_summary` avec un `y` cohérent avec `top: 10%` de la zone (≈ y 90)
- Vérifier que le libellé `Modalités de règlement` (y 500) reste au-dessus de la zone `conditions` (top 65%)

### D. Republier la version
Après modification du seed, republier via le bouton existant "Initialiser Contrat Cadre Services" (déjà upsert versionné) → v17.

## Détails techniques

Fichiers touchés :
- `src/components/service-proposal/ServiceProposalPreview.tsx` : ajouter le toggle `Devis | Contrat` dans l'en-tête du navigateur de pages, état local `mode`.
- `src/lib/seedContratCadreTemplate.ts` : réécrire les pages 1 et 2 (nouvelles coordonnées, libellés alignés aux zones dynamiques).

Aucun changement de schéma DB, aucun changement d'export PDF.

## Hors périmètre
- Pages 4-9 (juridiques) : inchangées.
- Le mode d'export automatique lors de la validation (génère bien le PDF `contrat` avec les 9 pages) : inchangé.