
## 1. Périodicité mise en évidence sur "Loyers HT (issus de la proposition)"

`src/components/contracts/ContractRow.tsx` — dans le bloc `hasProposalRent` (l.378-382), mettre en surbrillance la ligne correspondant à `paymentFrequency` (fond `bg-primary/10`, texte `text-primary font-semibold`, badge « sélectionnée ») et griser l'autre. Idem dans le résumé collapsed (l.235-239).

## 2. Barre de recherche — Contrats Location & Services

`src/components/contracts/ContractsView.tsx` et `src/components/service-proposal/ServiceContractsView.tsx` :
- Ajouter un `Input` avec icône `Search` en haut de la vue (au-dessus du bloc filtres).
- État `searchQuery`, filtrage insensible à la casse sur : `client_name`, `contract_number`, `commercial_name`.

## 3. Tri par date d'échéance

Mêmes deux fichiers. Ajouter un `Select` « Tri » à côté de la barre de recherche avec options :
- Récents (défaut, tri actuel par `validated_at`)
- Échéance croissante / décroissante — calcul via `implementation_month + duration_months` (contrats sans échéance renvoyés en fin de liste).

Le tri est appliqué sur `filteredContracts` avant le `groupByCommercial`.

## 4. Enseigne 3D Dental dans les filtres

Dans les deux `SelectContent` des filtres Enseigne (ContractsView l.218-223 et ServiceContractsView l.202-207) : ajouter `<SelectItem value="3d-dental">3D Dental</SelectItem>` (le mapping existe déjà côté stats).

## 5. Durée du contrat libre — Propositions Services & Contrats

**`src/components/service-proposal/ServiceProposalDataStep.tsx`** (bloc « Durée du contrat » l.215-233) : à côté des boutons 12/24/36/48/60, ajouter un `Input type="number"` (label « Autre »). La saisie remplit `contract_duration` en tant que nombre ; les boutons prédéfinis restent surlignés uniquement quand la valeur correspond.

Étendre le type `ServiceDataFormValues.contract_duration` en `number | ''` pour lever la contrainte 12|24|36|48|60. Vérifier que `ServiceProposalView.tsx` propage la valeur sans cast restrictif.

**`src/components/contracts/ContractRow.tsx`** (bloc Durée l.437-458) : remplacer le `Select` (branche non-quick) par un couple `Select` + `Input type="number"` libre — l'input a priorité s'il est renseigné. La branche `isQuick` reste inchangée (déjà libre).

## 6. Mode de règlement « Allin » — Propositions Services

- `src/hooks/useServiceProposals.ts` (l.32) : étendre le type `payment_mode` à `'prelevement' | 'virement' | 'allin' | null`.
- `src/components/service-proposal/ServiceProposalDataStep.tsx` (l.8-14 et l.187-201) : étendre `payment_mode` à `'prelevement' | 'virement' | 'allin' | ''` et ajouter le bouton « Allin ».
- `src/components/service-proposal/ServiceProposalView.tsx` (l.406) : ajuster le cast en `'prelevement' | 'virement' | 'allin' | null`.

Aucune migration nécessaire (colonne `text` côté DB).

## 7. Calendrier jour+mois pour "Mois de mise en place"

`src/components/contracts/ContractRow.tsx` :
- Remplacer l'`Input type="month"` (l.407-413) par un `Popover` + `Calendar` (shadcn datepicker, `mode="single"`, `pointer-events-auto`).
- État interne : `implementationDate: Date | undefined` (au lieu du string YYYY-MM). Le libellé du bouton affiche `dd/MM/yyyy` via `date-fns`.
- Dans `handleSave` : sérialiser en `yyyy-MM-dd` (au lieu du `${month}-01` actuel) pour `implementation_month`. La colonne DB étant `date`, aucun changement de schéma.
- Ajuster le calcul de `endDate` (l.76-78) : `addMonths(implementationDate, ...)` directement.
- Renommer visuellement le label en « Date de mise en place ».

## Détails techniques

- Aucune migration DB (les colonnes existantes acceptent déjà les valeurs).
- Les stats (`ContractsStatsView`) contiennent déjà le mapping `3D Dental` : rien à changer.
- Vérifier que `format(parseISO(contract.implementation_month), 'MM/yyyy')` (résumé l.242) continue de fonctionner avec un `yyyy-MM-dd` complet — c'est déjà le cas.
