

## Ajout du mode de tarification "par machine" / "pour le parc"

### Modifications

**1. Store (`src/stores/rentalProposalStore.ts`)**
- Ajouter un champ `pricingScope: 'par_machine' | 'pour_le_parc'` à l'interface `OptionService` (défaut : `'par_machine'`).
- Assurer la migration des données existantes (valeur par défaut dans le `migrate`).

**2. Editeur (`src/components/rental-proposal/RentalDataEditor.tsx`)**
- Ajouter un toggle similaire au toggle "Afficher : /mois | total" existant, avec deux boutons : "par machine" et "pour le parc".
- Placement : sous le toggle d'affichage du prix existant.

**3. Aperçu (`src/components/rental-proposal/RentalProposalPreview.tsx`)**
- Dans le rendu du bloc `nos-option` (lignes 1195-1231), afficher le suffixe "/machine" ou "/parc" après le prix.

**4. Export PDF (`src/components/rental-proposal/RentalProposalExport.tsx`)**
- Dans `makeNosOptionHTML` (lignes 581-594), ajouter le même suffixe "/machine" ou "/parc" dans le HTML du prix.

### Détail du suffixe affiché

| Mode prix | Scope | Texte affiché |
|---|---|---|
| mensuel | par_machine | `X €/mois /machine` |
| mensuel | pour_le_parc | `X €/mois /parc` |
| total | par_machine | `X € /machine` |
| total | pour_le_parc | `X € /parc` |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `rentalProposalStore.ts` | Ajouter `pricingScope` à `OptionService`, défaut `'par_machine'`, migration |
| `RentalDataEditor.tsx` | Ajouter toggle "par machine" / "pour le parc" sous le toggle prix |
| `RentalProposalPreview.tsx` | Afficher suffixe scope dans le prix de l'option |
| `RentalProposalExport.tsx` | Afficher suffixe scope dans le HTML du prix |

