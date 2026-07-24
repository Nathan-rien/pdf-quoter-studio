## Objectif
Éliminer l'espace vide en bas des pages Conditions Générales du Contrat Services (actuellement 3 pages CG dont la dernière quasi vide). Cible : 2 pages CG bien remplies, signatures pinées en bas de la dernière page.

## Constat
Dans `src/lib/service-proposal-html-generator.ts`, la pagination CG utilise des budgets caractères conservateurs :
- `MAX_CHARS_PER_PAGE = 4200`
- `MAX_CHARS_LAST_PAGE = MAX_CHARS_PER_PAGE - 1400` (réserve signatures)
- `MAX_CHARS_FIRST_PAGE = MAX_CHARS_PER_PAGE - introChars - 400`

Avec la réduction récente des polices (9.5 / 10.5 px), ces budgets sont sous-dimensionnés → une 3ᵉ page CG est créée pour ne recevoir que l'article XIII + les signatures.

## Changements
Fichier unique : `src/lib/service-proposal-html-generator.ts` (bloc CG, ~lignes 909-970).

1. Recalibrer les budgets caractères pour refléter la taille de police actuelle :
   - `MAX_CHARS_PER_PAGE` : 4200 → ~6200
   - Réserve signatures : 1400 → ~1100 (le bloc a été condensé)
   - Réserve intro pleine largeur : 400 → ~300
2. Conserver la logique existante (split par colonnes, éviter titre orphelin, flex pinning des signatures).
3. Garder la génération d'une page supplémentaire uniquement si le contenu déborde réellement (fallback intact).

## Résultat attendu
- Page 6/7 : intro pleine largeur + articles I → V (comme aujourd'hui, un peu plus dense).
- Page 7/7 : articles VI → XIII + bloc Signatures épinglé en bas, sans grande zone vide.
- Aucune modification de contenu, de style, ni de structure des pages devis.

## Validation
Après implémentation : ouvrir un contrat services existant, vérifier que le PDF Contrat Cadre Services fait 7 pages (3 devis + 4 contrat : couverture/périmètre/matériel + 2 CG au lieu de 3) et que le bas de chaque page CG est rempli.