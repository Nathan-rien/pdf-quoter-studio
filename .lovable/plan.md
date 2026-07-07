## Objectif

Sur la ligne repliée d'un contrat rapide, afficher les mêmes informations que sur un contrat normal : loyer **Mensuel** + **Trimestriel** (avec mise en évidence de la périodicité sélectionnée), partenaire financier, durée, date de fin, PDF joint, etc.

Aujourd'hui les contrats rapides n'affichent ni le mensuel ni le trimestriel dans le résumé, même quand les montants ont été saisis.

## Fichier modifié

`src/components/contracts/ContractRow.tsx`

## Changements

1. **Calcul du trimestriel pour les contrats rapides** (ligne ~91-93)
   - Aujourd'hui : `quarterlyRent` = uniquement la valeur manuelle trimestrielle saisie.
   - Nouveau : si l'utilisateur n'a saisi que le mensuel, calculer automatiquement le trimestriel (`calculateLoyerTrimestriel(monthly) ?? monthly * 3`), comme pour un contrat normal. Idem inverse : si seul le trimestriel est saisi, en déduire le mensuel (`quarterly / 3`) pour l'affichage.

2. **Affichage du bloc Mensuel/Trimestriel dans le header** (lignes 239-249)
   - La condition `monthlyRent != null` reste, mais grâce au point 1 elle se déclenchera dès qu'un des deux montants est renseigné sur un contrat rapide.
   - Aucune autre modification visuelle nécessaire : le même rendu (« Mensuel X € · Trimestriel Y € » avec surlignage de la périodicité active) s'appliquera automatiquement aux contrats rapides.

3. **Ligne secondaire template/description** (ligne 258-260)
   - Pour un contrat rapide, `template_name` est vide → afficher à la place `contract.client_name` complémentaire n'a pas de sens. On garde le comportement actuel (rien) — le badge « CONTRAT RAPIDE » à droite joue déjà ce rôle informatif.

## Hors périmètre

- Pas de changement de logique métier (calculs, persistance).
- Pas de modification de la vue étendue (formulaire d'édition) — elle est déjà cohérente.
- Pas de changement backend / migration.
