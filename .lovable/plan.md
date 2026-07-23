## Cause racine
Le sélecteur CSS actuel `.shell-content > .shell-block` (ligne 998) cible les enfants **directs** de `.shell-content`. Or, depuis l'introduction du wrapper de mise à l'échelle (`<div data-shell-scale>` aux lignes 645 et 834), les `.shell-block` sont désormais enfants de `data-shell-scale`, pas de `.shell-content`. **La marge de 90mm (comme les 20mm précédents) n'est jamais appliquée** — l'espacement visible provient uniquement des `margin-bottom` internes des zones dynamiques.

## Correction
Dans `src/lib/service-proposal-html-generator.ts` :

- Ligne 998 : remplacer le sélecteur `.shell-content > .shell-block` par `.shell-content .shell-block` (descendant, plus enfant direct).
- Ligne 999 : idem pour la règle `:last-child`.

Garder la valeur à `90mm` comme demandé.

## Vérification
- Recharger l'aperçu de la proposition EXTENDE.
- Confirmer que les 4 encarts (COORDONNÉES, SITES D'INTERVENTION, CONTACT OPÉRATIONNEL, PRESTATAIRES EXTÉRIEURS) sont désormais nettement plus espacés. Si le total dépasse la hauteur disponible, `fitPageContentBlocks` réduira automatiquement l'ensemble via `transform: scale()` (plancher 0.75), sans chevaucher le pied de page.
