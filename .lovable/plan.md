## Corrections à apporter

### 1. Remplacer l'icône Dollar par Euro (partout)
- `src/components/workflow/WorkflowProgress.tsx` : import `Euro` au lieu de `DollarSign`, remplacer dans le mapping `csv-import`.
- `src/components/options-admin/OptionsServiceCard.tsx` : remplacer les 2 usages `<DollarSign />` par `<Euro />`.
- Aucun autre `DollarSign` métier (les autres sont dans `IconPicker`/`lucide-svg-paths` — bibliothèque d'icônes du template editor, à conserver).

### 2. Onglet "Nos Options" — Contrat/Proposition Services
Fichier : `src/components/service-proposal/ServiceProposalNosOptionsStep.tsx`
- Remplacer le bouton unique "Importer depuis Admin" (Popover) par deux boutons distincts :
  - **"Ajouter Option"** → ouvre le picker filtré sur `option.kind !== 'pack'`.
  - **"Ajouter Pack"** → ouvre le picker filtré sur `option.kind === 'pack'`.
- Chaque bouton conserve la logique existante d'import multi-sélection (`handleImportSelected` scindée en deux).

### 3. Template Contrat page 2 — "Vos modalités de règlement"
Fichier : `src/lib/service-proposal-html-generator.ts` (`renderConditionsZone`)
- Retirer la ligne `['Total HT services', …]` du tableau `conditionsRows` **uniquement en mode contrat** (`documentScope === 'contrat'`). Laisser en mode devis pour ne pas casser la proposition.

### 4. Ajouter "Total Service HT" dans le contrat services
- Dans `renderOptionsSummaryZone` (encart "Services & packs souscrits"), ajouter en pied de carte une ligne récapitulative **"Total Service HT : X €"** basée sur `totalServicesHt` (déjà calculé en amont dans le générateur).
- Visible en mode contrat comme en mode devis.

### 5. Encart "Services & packs souscrits" — reprendre le montant de chaque option
Fichier : `src/lib/service-proposal-html-generator.ts` (`renderOptionsSummaryZone`)
- Actuellement seul le nom est affiché (`• {name}`).
- Ajouter à droite de chaque ligne le prix formaté via `getOptionPriceLabel` (utilitaire existant `src/lib/options-price-utils.ts`), en respectant `showPrice`/`showPriceMode`. Fallback "—" si aucun prix.
- Layout : `flex justify-between` pour aligner le prix à droite ; typographie identique aux autres cartes.

### 6. Reprendre les services/options de la proposition dans chaque contrat
Fichier : `src/components/contracts/ContractRow.tsx`
- Ajouter dans la zone dépliée (après les autres blocs, avant les pièces jointes) un bloc **"Services & options"** en lecture seule.
- Source des données : réutiliser `useContractProposalRent` pattern → nouveau hook léger `useContractProposalOptions(proposalId)` dans `src/hooks/useContracts.ts` qui lit `proposal_state.nosOptions` (proposition Services) ou `proposal_state.optionsServices` (proposition Location) depuis `proposal_exports`.
- Affichage : liste à puces `nom — prix formaté` (via `getOptionPriceLabel`). Rien pour les contrats rapides (pas de `proposal_id` réel).

## Portée
- UI + génération HTML uniquement. Aucune migration SQL. Aucun impact sur les calculs financiers ni sur la persistance.
- Templates existants non modifiés (la logique documentScope reste inchangée).
