## Constat
Sur la page 6 (CG 1/2) du Contrat Services, le texte déborde sous le nouveau bandeau bas alors qu'il reste de l'espace libre entre l'en-tête noir et le début du contenu. Dans `src/lib/service-proposal-html-generator.ts` :
- `renderCgHeader` : hauteur 17mm.
- `renderCgShell` : contenu positionné à `top:22mm` (5mm d'écart au-dessus).

## Changement
Fichier unique : `src/lib/service-proposal-html-generator.ts`, dans `renderCgShell`.

- Réduire l'offset supérieur du contenu de `top:22mm` à `top:18mm` (colle le contenu juste sous l'en-tête, en gardant 1mm de respiration).
- Pas de modification du footer, de la pagination, ni des tailles de police.

## Résultat
Le contenu des pages CG gagne ~4mm en hauteur utile, ce qui absorbe le débordement actuel sous le bandeau bas sur la page 6.