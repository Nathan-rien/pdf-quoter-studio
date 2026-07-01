## Problème identifié

Dans l'éditeur, tu as placé le titre statique **"Vos modalités de règlement"** juste au-dessus de la zone dynamique **`service_conditions`** (Données contrats). Mais à l'affichage, la zone dynamique est décalée vers le bas et se sépare de son titre.

**Cause :** dans `ServiceProposalPreview.tsx` et `ServiceProposalExport.tsx`, la fonction `layoutServiceZones` réempile automatiquement les zones dynamiques d'une même page pour éviter les chevauchements. Quand la zone `service_invest_table` du haut contient beaucoup de lignes, sa hauteur estimée dépasse sa position d'origine, et la zone `service_conditions` est poussée vers le bas — mais le **titre statique** reste à sa position d'origine dans le template. D'où la déconnexion visuelle.

Le titre "Dans votre proposition :" fonctionne parce qu'il est au-dessus de la **première** zone (jamais poussée) — la logique d'empilement ne l'affecte pas.

## Solution proposée

Rendre le titre **solidaire** de la zone dynamique en le générant à l'intérieur de la zone `service_conditions` elle-même, plutôt que comme élément statique séparé.

### Étapes

1. **`ServiceProposalPreview.tsx`** — dans le rendu de `service_conditions` (lignes 424-446), ajouter un titre `Vos modalités de règlement` au-dessus du tableau (à l'intérieur du même conteneur absolument positionné). Ainsi, quand la zone est repoussée vers le bas par l'auto-stacking, le titre suit.

2. **`ServiceProposalExport.tsx`** — même modification dans `renderConditionsZone` pour que le PDF exporté reflète l'aperçu.

3. **`seedContratCadreTemplate.ts`** — supprimer le titre statique "Vos modalités de règlement" du seed (pour que "Initialiser Contrat Cadre Services" ne le recrée plus). Le titre "Dans votre proposition :" reste car il est associé à une zone jamais déplacée.

4. **Action utilisateur** — après application, supprimer manuellement le titre statique existant "Vos modalités de règlement" du template actuel dans l'éditeur (le seed ne réécrit pas le template existant sans "Initialiser"). Ton template modifié n'est pas écrasé.

### Alternative (non retenue)

Désactiver l'auto-stacking et faire strictement confiance aux positions du template. Rejeté car cela réintroduirait les chevauchements quand le tableau produits contient beaucoup de lignes (problème que l'auto-stacking a résolu précédemment).

### Résultat attendu

Le titre "Vos modalités de règlement" apparaît toujours collé au tableau des données contrats, quelle que soit la hauteur du tableau produits situé au-dessus, sans casser la mise en page existante.