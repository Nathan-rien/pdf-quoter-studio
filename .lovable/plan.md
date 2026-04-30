
## Objectif

Permettre, dans l'admin **Base Taux**, d'éditer directement les cellules **Montant min**, **Montant max**, **Durée** et **Taux** (le **Partenaire** reste non modifiable pour préserver la cohérence des lookups). Toute modification doit être **immédiatement répercutée partout** où ces données sont utilisées : calculs de proposition, aperçus, exports.

## Constat important (bug existant à corriger)

En explorant le code, j'ai identifié un problème déjà présent indépendamment de votre demande :

- `BaseTauxAdmin.tsx` met à jour une variable `runtimeBaseTaux` (en mémoire) lors d'un import Excel.
- **Mais** `src/lib/rental-calculations.ts` (`lookupCoefficient`) et `src/components/rental-proposal/RentalDataEditor.tsx` lisent directement la constante statique `BASE_TAUX_DATA` importée depuis `src/data/base-taux.ts`.
- Conséquence : **aucun import Excel ne change réellement les coefficients utilisés dans les calculs**. Idem pour de futures éditions inline si on ne corrige pas ce point.

Donc avant d'ajouter l'édition, il faut centraliser la source de vérité runtime, sinon les modifications resteraient cosmétiques.

## Ce qui sera fait

### 1. Centraliser la source de vérité runtime
- Créer un store léger `src/stores/baseTauxStore.ts` (zustand, comme les autres stores du projet) avec :
  - `entries: BaseTauxEntry[]` initialisées depuis `BASE_TAUX_DATA`
  - `updateEntry(index, patch)`, `setAll(entries)`, `reset()`
  - **Persistance localStorage** pour conserver les modifications entre sessions et entre onglets (cohérent avec les autres données admin).
- Exposer un sélecteur `getBaseTauxRuntime()` utilisable hors composant React.

### 2. Brancher tous les consommateurs sur le store
- `src/lib/rental-calculations.ts` → `lookupCoefficient` lit le store au lieu de `BASE_TAUX_DATA`.
- `src/components/rental-proposal/RentalDataEditor.tsx` → tableau d'aide affiche les entrées du store (et non plus la constante).
- `src/pages/BaseTauxAdmin.tsx` → affiche, édite et importe via le store.
- La constante `BASE_TAUX_DATA` reste utilisée uniquement comme **valeur initiale / reset par défaut**.

### 3. Édition inline dans BaseTauxAdmin
- Rendre les cellules **Montant min**, **Montant max**, **Durée**, **Taux** éditables :
  - Clic sur une cellule → champ `Input` numérique avec valeur courante.
  - `Enter` ou blur → validation + commit dans le store.
  - `Escape` → annulation.
- Validation par champ :
  - Montant min ≥ 0, Montant max > Montant min.
  - Durée : nombre entier > 0 (suggestions visuelles : 18, 24, 36, 48, 60).
  - Taux : nombre > 0, jusqu'à 6 décimales.
- Indicateur visuel : ligne modifiée mise en évidence légèrement, toast "Modifié" discret au commit.
- Le champ **Partenaire** reste affiché en lecture seule (renommer un partenaire casserait les lookups existants — à traiter séparément si besoin).

### 4. Actions complémentaires
- Bouton **"Réinitialiser aux valeurs par défaut"** restauré et clair (vide localStorage et recharge `BASE_TAUX_DATA`).
- L'import Excel continue de fonctionner et écrase également via le store.
- Les filtres existants (recherche, partenaire, durée) sont préservés ; l'édition se fait sur la ligne réellement éditée même si la liste est filtrée.

### 5. Vérifications de répercussion
- Modifier un taux dans l'admin → ouvrir une proposition de location avec ce partenaire/montant/durée → le coefficient affiché et tous les calculs dérivés (loyer, somme loyers, coût contrat, coût locatif annuel, marge loc) reflètent immédiatement la nouvelle valeur.
- Recharger la page → la modification est conservée (localStorage).
- Réinitialiser → on revient aux 136 entrées d'origine.

## Fichiers concernés

- `src/stores/baseTauxStore.ts` *(nouveau)*
- `src/pages/BaseTauxAdmin.tsx` *(édition inline + branchement store)*
- `src/lib/rental-calculations.ts` *(lecture via store)*
- `src/components/rental-proposal/RentalDataEditor.tsx` *(lecture via store)*

## Hors scope (peut être traité plus tard si besoin)

- Édition du nom de **Partenaire** (impacte les lookups par clé, nécessite migration des références).
- Ajout / suppression de lignes (déjà possible via import Excel ; on peut l'ajouter en édition inline si vous le souhaitez — dites-le moi).
- Persistance côté base de données (actuellement tout est en localStorage côté client, conforme à l'existant).
