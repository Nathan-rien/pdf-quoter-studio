## Objectif

Fusionner la sélection des services entre "Données" et "Nos Options", ajouter la notion de **Pack** dans le catalogue Options Services, et exposer un champ **Référence ERP (JAJA)** uniquement dans l'admin.

## 1. Fusion Données ↔ Nos Options (source unique = nosOptions)

- **`serviceProposalStore.ts`** :
  - `selected_services` devient **dérivé** de `nosOptions` (getter/selector) — plus de setter direct.
  - Chaque `NosOption` sélectionnée est projetée en `ServiceLine` : `{ service_id, label, amount_ht (= prix option ou pack), show_price_mode }`.
- **`ServiceProposalDataStep.tsx`** :
  - Supprime toute la partie "ajouter/tarifer un service" (lignes éditables, boutons + / suppression, toggles /mois total).
  - Affiche en lecture seule la liste des noms des services/packs cochés (une ligne par item, nom seul, empilé verticalement), avec un message "Sélectionnez les services dans l'onglet Nos Options" si vide.
  - Conserve : total services HT (calculé depuis nosOptions), périodicité, mode de paiement, durée, date de début, champ calculé loyer mensuel/trimestriel.
- **`ServiceProposalNosOptionsStep.tsx`** : reste la seule source de saisie (checkbox + description + prix).
- **`useServiceProposals.ts`** : le payload envoyé à Supabase inclut `selected_services` calculé à partir de `nosOptions` au moment du save (pas de doublon en base — on garde `selected_services` en colonne pour compat mais rempli automatiquement).
- **`ServiceProposalExport.tsx`** / **`ServiceProposalPreview.tsx`** : aucun changement de rendu — ils consomment déjà `selected_services` / zones dynamiques `service_options` et `service_invest_table`.

## 2. Notion de "Pack" dans le catalogue Options Services

- **Migration DB** sur `public.options_services` :
  - Ajout `kind text NOT NULL DEFAULT 'option'` (valeurs : `'option' | 'pack'`).
  - Ajout `pack_service_ids uuid[] DEFAULT '{}'` (liste des services regroupés — pour affichage détail).
  - Ajout `erp_reference text` (champ JAJA, optionnel).
- **Types (`options-admin.ts`, `optionsAdminStore.ts`)** :
  - `ServiceOptionDefinition` reçoit `kind`, `packServiceIds?`, `erpReference?`.
- **Admin (`OptionsServicesAdmin.tsx`)** :
  - Nouveau bouton **"Nouveau pack"** à côté de "Nouvelle option".
- **`OptionsServiceCard.tsx`** :
  - Affiche un badge "PACK" si `kind === 'pack'`.
  - Pour un pack : sélecteur multi-services (checkbox list depuis les autres options actives, hors packs) pour composer `packServiceIds`, avec affichage compact des services inclus.
  - Le prix du pack reste saisi indépendamment (remise possible).
  - Nouveau champ texte **"Référence ERP (JAJA)"** (visible sur options ET packs, admin uniquement).
- **`ServiceProposalNosOptionsStep.tsx`** : un pack est sélectionnable exactement comme une option (même UI checkbox + prix). Le détail des services inclus s'affiche en sous-ligne info.

## 3. Champ Référence ERP (JAJA)

- Texte libre, optionnel, sur options et packs.
- Visible/éditable **uniquement** dans `OptionsServicesAdmin.tsx` (via `OptionsServiceCard`).
- Non exposé dans le devis client, ni dans le preview/export PDF.
- Aucune intégration technique — fondation seule.

## Fichiers touchés

- Migration SQL : `options_services` (+ 3 colonnes)
- `src/types/options-admin.ts`
- `src/stores/optionsAdminStore.ts`
- `src/stores/serviceProposalStore.ts`
- `src/hooks/useServiceProposals.ts`
- `src/pages/OptionsServicesAdmin.tsx`
- `src/components/options-admin/OptionsServiceCard.tsx`
- `src/components/service-proposal/ServiceProposalDataStep.tsx`
- `src/components/service-proposal/ServiceProposalNosOptionsStep.tsx`

Aucun changement sur `ServiceProposalExport.tsx` / `ServiceProposalPreview.tsx` (consommation inchangée).

## Ordre d'exécution

1. Migration DB (attente approbation).
2. Types + stores.
3. Admin (packs + champ ERP).
4. Refonte Data step + dérivation selected_services.
5. Adaptation Nos Options step pour afficher packs.
6. Vérification build.
