## Ajout "Créer contrat rapide" (Contrats Location)

Ajouter un second bouton à côté de "+ Créer un contrat manuellement" dans `ContractsView.tsx` (section Location) : **"⚡ Créer contrat rapide"**.

### Comportement
- Ouvre directement une ligne contrat éditable (même UI que l'écran fourni en capture) sans passer par le workflow de proposition.
- Tous les champs sont **libres** (aucun sélecteur lié aux données existantes) :
  - **Client** : input texte libre (au lieu du sélecteur client actuel)
  - **Commercial en charge** : input texte libre (au lieu du dropdown `useCommerciaux`)
  - **Partenaire financier** : input texte libre (au lieu du dropdown refinanceurs)
  - **Durée (mois)** : input numérique libre (au lieu du dropdown 36/48/60)
  - **Numéro de contrat** : input texte libre (déjà existant)
  - **Loyer HT** : deux inputs libres — Mensuel et Trimestriel (indépendants, pas de calcul auto ×3)
  - **Mois de mise en place** : date libre
  - **Périodicité** : toggle Mensuel/Trimestriel (identique)
  - **Pièce jointe (PDF)** : upload identique

### Implémentation technique

1. **`rentalProposalStore.ts`** — ajouter `startQuickContract()` : marque un flag `isQuickContract = true` puis crée immédiatement un contrat en base avec des valeurs vides (`client_name = ''`, `commercial = ''`, `refinanceur = ''`, `duree_mois = null`, `proposal_type = 'location'`, `proposal_export_id = null`).

2. **`ContractsView.tsx`** (section Location uniquement) :
   - Ajouter le bouton "⚡ Créer contrat rapide" à côté du bouton existant.
   - Handler → crée le contrat vide via `useCreateContract` puis auto-ouvre la ligne en mode édition (via un state `autoExpandId`).

3. **`ContractRow.tsx`** — introduire un mode "quick / libre" détecté par l'absence de `proposal_export_id` **ET** un nouveau flag `is_quick` (colonne à ajouter) OU simplement par l'absence de proposition liée :
   - Remplacer le dropdown Commercial par `<Input>` texte
   - Remplacer le dropdown Partenaire financier par `<Input>` texte
   - Remplacer le dropdown Durée par `<Input type="number">`
   - Remplacer l'affichage "Loyer HT (issu de la proposition)" en lecture seule par deux `<Input>` éditables (mensuel + trimestriel indépendants)
   - Afficher le client comme input texte libre (nouveau champ à afficher en tête de ligne)

4. **Migration base de données** :
   - Ajouter `is_quick_contract BOOLEAN DEFAULT false` sur `contracts` (pour distinguer le mode)
   - Ajouter `quarterly_rent_ht NUMERIC` (loyer trimestriel indépendant, pas dérivé du mensuel)
   - `client_name`, `commercial`, `refinanceur` existent déjà en TEXT donc restent utilisables tels quels.

5. **Régénérer** `src/integrations/supabase/types.ts` après migration.

### Points de vigilance
- Le contrat rapide n'apparaît **pas** dans les alertes de renouvellement basées sur proposition ; il utilise uniquement ses champs libres.
- Le bouton "Visualiser" (proposition liée) est masqué en mode quick (pas de `proposal_export_id`).
- Les filtres existants (enseigne, partenaire, commerciale) fonctionnent sur les champs texte libres — pas de changement.

### Hors périmètre
- Aucune modification du parcours Contrats Services.
- Aucune modification de la logique de dérivation des loyers pour les contrats liés à une proposition.
