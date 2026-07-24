## Problème

Les articles des Conditions Générales sont découpés en trop de pages (6+7 séparées, 8+9 séparées). Chaque paire peut tenir sur une seule page. La cause est le budget de pagination `MAX_CHARS_PER_PAGE = 2300` dans `src/lib/service-proposal-html-generator.ts`, qui a été baissé lors du passage à 10.5px pour l'unification typographique avec le devis — mais ce budget est désormais trop conservateur et force des sauts de page inutiles.

## Correction

Fichier : `src/lib/service-proposal-html-generator.ts`

1. Augmenter le budget de pagination des articles CG :
   - `MAX_CHARS_PER_PAGE` : `2300` → `4200` pour permettre de regrouper les articles courts sur une même page.
2. Ajuster le budget de la page "Parties contractantes" si nécessaire :
   - `MAX_PARTIES_CHARS` : `1750` → `3000`, cohérent avec le nouveau budget articles.
3. Ne pas modifier :
   - Les tailles de police (10.5px paragraphes / 11.5px titres restent en place).
   - Le mécanisme `fitPageContentBlocks` (auto-shrink uniforme) — il sert désormais uniquement de filet de sécurité si un article dépasse malgré le nouveau budget.
   - La structure du devis (pages 1–3) : aucun impact.

## Résultat attendu

Les articles CG sont regroupés : les anciennes paires (6+7, 8+9) tiennent chacune sur une seule page, réduisant le nombre total de pages contrat. Si un regroupement dépasse malgré tout, l'auto-shrink documentaire s'applique et conserve une taille de texte uniforme sur toutes les pages.