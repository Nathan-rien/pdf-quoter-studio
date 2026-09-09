# Page 5 de signature dans le devis Services

Ajouter, dans l'aperçu et l'export des Propositions Services (mode Devis uniquement), une dernière page reprenant les coordonnées et les encarts de signature, dans le même style que la page de signature du contrat.

## Contenu de la page

1. Bandeau de page « Signatures » (même en-tête et même pied de page que les autres pages du devis).
2. Rappel des coordonnées : bloc « Bénéficiaire » (raison sociale, nom, adresse, email, téléphone) et bloc « Votre interlocuteur » (commercial : nom, téléphone, email, entité), présentés côte à côte comme sur la page 1.
3. Zone signatures :
   - « Fait à ______ »
   - « Le ______ »
   - Deux encarts côte à côte : à gauche « La Société Groupe Cybertek SAS / Représentée par Grégory Moinet / Directeur Services et Solutions / Signature : ______ », à droite « La Société <client> / Représentée par <nom client> / Signature : ______ ».

## Comportement

- La page n'apparaît qu'en mode Devis (le mode Contrat conserve sa page de signatures existante en fin de conditions générales).
- Elle est toujours ajoutée en dernière position, après les pages du template visibles en devis.
- Aperçu et export PDF affichent exactement la même page, puisqu'ils partagent le même générateur.

## Détails techniques

- `src/lib/service-proposal-html-generator.ts` :
  - nouvelle fonction `renderDevisSignaturePage()` construisant le corps (rappel coordonnées + « Fait à / Le » + encarts) et rendue via `renderShellPage('Signatures', body)` pour hériter de l'en-tête et du pied de page devis ;
  - réutilisation des styles existants (`BLOCK_WRAPPER_STYLE`, `SECTION_BANNER_STYLE`, `SECTION_BODY_STYLE`, `LABEL_STYLE`, `VALUE_STYLE`, `BODY_TEXT_STYLE`) et du contenu de `renderSignatureZone` pour les deux encarts ;
  - après la boucle `for (const page of visibleTemplatePages)`, ajout de `if (mode !== 'contrat') allPagesHtml.push(...)`.
- Aucun changement de base de données, de template ou de composant : `ServiceProposalPreview.tsx` et `ServiceProposalExport.tsx` consomment déjà le HTML généré et recalculent le nombre de pages automatiquement.
