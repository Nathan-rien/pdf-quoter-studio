## Ajout du champ Capital Social

### Objectif
Ajouter un champ "Capital Social" dans la fiche Client des Propositions Services, et le reporter dans l'encart "Coordonnées Bénéficiaire" du devis/contrat.

### Modifications

1. **Store** (`src/stores/serviceProposalStore.ts`)
   - Ajouter `capitalSocial: string` dans `clientData` (init `''`, persistance existante conservée).

2. **UI Client** (`src/components/service-proposal/ServiceProposalClientStep.tsx`)
   - Ajouter un champ texte "Capital Social" dans le bloc Client (à côté du SIRET).

3. **Persistance DB** (`service_proposals`)
   - Ajouter colonne `client_capital_social text` via migration.
   - Sauvegarder/charger la valeur dans `useServiceProposals` (et data-builder).

4. **Data builder** (`src/lib/service-proposal-data-builder.ts`)
   - Propager `capitalSocial` dans `clientData` (store + DB row).

5. **Rendu PDF** (`src/lib/service-proposal-html-generator.ts`)
   - Dans l'encart "Coordonnées Bénéficiaire" (page 1), afficher "Capital social : {valeur}" si renseigné, sans modifier la mise en page globale.

### Hors périmètre
Aucun autre écran, aucune autre logique modifiée.
