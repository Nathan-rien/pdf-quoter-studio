Le titre "MODALITÉS DE RÈGLEMENT" est un élément statique en dur sur la page 2 du template `Contrat Cadre Services`. Le titre dynamique "Vos modalités de règlement" est déjà injecté par la zone dynamique `service_conditions`.

Plan d'intervention :

1. **Supprimer l'élément statique redondant** dans `src/lib/seedContratCadreTemplate.ts` (page 2, élément `p2p-lbl-cond` affichant "MODALITÉS DE RÈGLEMENT").
2. **Vérifier** qu'aucune autre occurrence du titre statique n'existe dans le générateur HTML ou les composants d'aperçu/export.
3. **Publier une nouvelle version** du template "Contrat Cadre Services" pour propager la correction aux documents générés ensuite.
4. **Vérifier visuellement** l'aperçu d'un contrat service pour confirmer que seul "Vos modalités de règlement" apparaît, sans doublon.

Fichiers concernés :
- `src/lib/seedContratCadreTemplate.ts`
- `src/lib/service-proposal-html-generator.ts` (vérification uniquement, pas de modification)