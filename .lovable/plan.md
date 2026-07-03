## 1. Champ "Cession" sur les contrats de Location

Dans `ContractRow.tsx` (partie détails/expanded), ajouter un nouveau champ visible uniquement pour les contrats de type `location` (pas `service`) :

- Libellé : **Cession**
- 4 boutons pastilles au style existant : `1%`, `2%`, `3%`, `4%` (sélection unique, optionnelle)
- Placé à côté de "Périodicité" dans la grille détails

**Backend** :
- Migration : ajouter `cession_percent smallint NULL` sur `public.contracts` avec `CHECK (cession_percent IN (1,2,3,4))`
- Mise à jour de l'interface `Contract` (`useContracts.ts`) et du mutateur `useUpdateContract`
- Persistance via `handleSave`

Visible également en résumé fermé (petit badge "Cession 2 %") quand renseigné.

## 2. Nouveau calcul mensualité / trimestrialité

Formule demandée :
- Mensualité = **Total services HT / durée du contrat (mois)**
- Trimestrialité = **Mensualité × 3**

Remplace l'actuelle division `/12` (mensuel) et `/4` (trimestriel).

Fichiers impactés (même helper partagé) :
- `src/components/service-proposal/ServiceProposalDataStep.tsx` : encart "Soit … / mois HT" ou "/ trimestre HT"
- `src/components/service-proposal/ServiceProposalPreview.tsx` : ligne "Loyer mensuel/trimestriel HT"
- `src/components/service-proposal/ServiceProposalExport.tsx` : même ligne dans le PDF
- `src/hooks/useContracts.ts` (`useContractProposalRent`) et `src/lib/contract-rent-aggregation.ts` (`computeFromExport`) : branche `state.kind === 'service-proposal'` → utiliser `duration` (déjà présent dans le state) au lieu du diviseur fixe

Comportement si `contract_duration` manquant / 0 : afficher un tiret ("—") plutôt que diviser par zéro, calcul ignoré côté agrégation.

Précision : `Math.round(x * 100) / 100` maintenu partout.

## 3. Toggle "/mois" vs "total" par ligne de service (onglet Données – Propositions Services)

Aligner l'UX des lignes Services sur celle des Options (voir capture) :

Dans `ServiceProposalDataStep.tsx` / `ServiceLineRow` :
- Ajouter à côté du toggle `total | /parc` (Scope) un second toggle **Afficher : /mois | total** (même style pastille noire)
- Nouveau champ sur `ServiceLine` : `show_price_mode: 'mensuel' | 'total'` (défaut `'total'` pour ne pas casser l'existant)
- Le montant saisi reste le même champ `amount_ht`; le mode contrôle uniquement l'affichage dans la Preview / Export

**Sémantique** :
- `total` = montant global sur la durée (comportement actuel)
- `mensuel` = montant / mois → dans Preview/Export, la ligne affiche "X,XX € / mois" et le total services HT annuel reste calculé en `amount_ht × durée` pour être cohérent avec le nouveau calcul de mensualité

Fichiers impactés :
- `src/hooks/useServiceProposals.ts` : ajout du champ dans `ServiceLine`
- `src/components/service-proposal/ServiceProposalDataStep.tsx` : UI toggle + total dynamique (somme des lignes converties en montant total = mensuel × durée si mode mensuel)
- `src/components/service-proposal/ServiceProposalPreview.tsx` & `ServiceProposalExport.tsx` : rendu du libellé par ligne + calcul du `totalServicesHt` cohérent
- Aucune migration DB : `selected_services` est déjà stocké en JSONB

## Zone hors périmètre

- Pas de modification de la logique des Options (déjà en place)
- Pas de modification des templates PDF Editor
- Pas de changement sur les propositions de Location (calculs matrice inchangés)
