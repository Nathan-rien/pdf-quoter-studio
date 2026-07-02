## Objectif
Reprendre la fonctionnalité « Options disponibles » de Propositions Location dans Propositions Services : gestion d'options sélectionnables (ajout manuel + import depuis Admin), avec rendu dans le template via une nouvelle zone dynamique dédiée.

## Modifications

### 1. Store `src/stores/serviceProposalStore.ts`
- Ajouter le state `nosOptions: OptionService[]` (réutiliser le type `OptionService` de `rentalProposalStore` ou dupliquer) : `{ id, name, description, price, priceTotal?, selected, pricingScope: 'par_machine' | 'pour_le_parc', showPrice, showPriceMode }`.
- Ajouter les actions `addNosOption / updateNosOption / deleteNosOption / toggleNosOption`.
- Inclure `nosOptions` dans le snapshot save/load (rétro-compat : default `[]`).
- Reset dans `resetProposal()`.

### 2. Nouvelle étape UI `src/components/service-proposal/ServiceProposalNosOptionsStep.tsx`
- Copie adaptée du bloc « Nos Options » de `RentalDataEditor.tsx` (lignes 748-935) :
  - Header + bouton « Importer depuis Admin » (Popover listant `useOptionsAdminStore` actives, checkbox multi-sélection).
  - Bouton « Ajouter » manuel.
  - Ligne d'option : Switch selected, Input Nom, Textarea Description, Input prix (€), toggle scope (/machine ou /parc), toggle « Prix visible » sur PDF, bouton supprimer.
- Simplification par rapport à Location : pas de calcul croisé « au mois / au total » (Services n'a pas de coefficient base-taux) → un seul champ prix.

### 3. Intégration onglet `src/components/service-proposal/ServiceProposalView.tsx`
- Ajouter un `TabsTrigger value="options"` intitulé « Nos Options » (avec Badge count des options sélectionnées) entre « Données » et « Invest ».
- Ajouter le `TabsContent` correspondant qui monte `ServiceProposalNosOptionsStep`.
- Ajuster `grid-cols-*` de la TabsList.

### 4. Nouvelle zone dynamique `service_options`
- `src/types/pdf-template.ts` : ajouter `'service_options'` à `DynamicZoneType` et une entrée dans `AVAILABLE_ZONE_TYPES` (`label: 'Options (Services)'`, sourceSheet: `'options_services'`, description : « Options sélectionnables affichées dans la proposition »).
- `src/components/template-editor/DynamicZoneManager.tsx` : rendre la zone disponible dans le contexte Services (aucun code spécifique si le filtrage se fait déjà par préfixe `service_`).

### 5. Rendu preview `src/components/service-proposal/ServiceProposalPreview.tsx`
- Lire `nosOptions` depuis le store.
- Ajouter un cas `zone.type === 'service_options'` dans `renderServiceDynamicZone` :
  - Titre : « Options ».
  - Liste des options avec `selected === true` (les autres non rendues).
  - Colonnes : Nom + Description, Prix (si `showPrice`) formaté selon `pricingScope` (`… €/machine` ou `… € /parc`).
- Ajouter estimation de hauteur (`estimateServiceZoneHeight`) sur ce type, basée sur le nombre d'options sélectionnées.

### 6. Rendu export `src/components/service-proposal/ServiceProposalExport.tsx`
- Ajouter la même logique de rendu HTML pour `zone.type === 'service_options'` (`renderNosOptionsZone`).
- Inclure `nosOptions` dans le snapshot exporté (`proposal_state`).

### 7. Seeder template Services `src/lib/seedContratCadreTemplate.ts`
- Ajouter une zone dynamique `service_options` (position par défaut sur une page appropriée, ex. sous le tableau produits). Optionnel : ne pas la seeder d'office pour laisser l'utilisateur la placer dans l'éditeur — à confirmer, par défaut on l'ajoute sur la page 3 sous les produits.

## Vérifications
- Onglet « Nos Options » visible avec Badge count.
- Ajout manuel + import depuis Admin fonctionnent.
- Rechargement d'anciennes propositions sans `nosOptions` : pas d'erreur (array vide).
- Zone `service_options` disponible dans DynamicZoneManager et rendue dans l'aperçu + PDF quand présente et lorsqu'au moins une option est `selected`.
- Aucun impact sur les autres zones/rendus.
