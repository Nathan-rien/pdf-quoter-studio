## Objectif

Masquer le bloc « Prestataires extérieurs » sur le PDF Devis (Proposition Services), et l'afficher uniquement sur le PDF Contrat Services.

## Modifications

1. **`src/lib/service-proposal-html-generator.ts`**
   - Localiser le rendu du bloc « PRESTATAIRES EXTÉRIEURS » (actuellement sur la page 1, scope `both`).
   - Conditionner son rendu au mode contrat uniquement : afficher le bloc si le document en cours est de scope `contrat`, le retirer complètement en mode `devis`.
   - Ajuster la hauteur/pagination de la page 1 en conséquence pour éviter les espaces vides en mode devis.

2. **Vérification**
   - Générer un aperçu devis : le bloc « Prestataires extérieurs » n'apparaît plus.
   - Générer un contrat services : le bloc apparaît (avec les prestataires saisis, ou le placeholder « Aucun prestataire renseigné »).
   - Aucun impact sur les Contrats Location.

## Hors périmètre

- Pas de changement sur la saisie (le champ reste dans `ServiceProposalClientStep`).
- Pas de changement sur le stockage des données.
