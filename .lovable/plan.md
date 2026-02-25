

## Diagnostic

Le probleme n'est pas un bug de code mais un probleme de donnees : la colonne `proposal_state` a ete ajoutee a la base, et le code d'export la remplit correctement, mais les 44 exports existants ont ete crees **avant** la migration et ont tous `proposal_state = null`. Le bouton Charger est present, mais au clic il recupere `null` et affiche "Chargement impossible".

Deux corrections sont necessaires :

## Plan de correction

### 1. Indicateur visuel sur les entrees non chargeables

Dans `HistoryView.tsx`, le composant `renderEntry` affiche le bouton Charger pour toutes les entrees en succes. Il faut ajouter une information sur la disponibilite du `proposal_state` directement dans la requete de liste, afin de desactiver visuellement le bouton pour les anciens exports.

| Fichier | Modification |
|---|---|
| `HistoryView.tsx` - Interface `ProposalExportSummary` | Ajouter un champ `has_proposal_state: boolean` |
| `HistoryView.tsx` - `fetchExports` | Ajouter `proposal_state` dans le select, puis mapper pour calculer `has_proposal_state` (sans charger le JSONB entier, on verifie juste `!= null`) |
| `HistoryView.tsx` - `renderEntry` | Desactiver le bouton Charger et afficher un tooltip "Donnees non disponibles (ancien export)" quand `has_proposal_state === false` |

**Note technique** : Supabase ne permet pas facilement un `SELECT proposal_state IS NOT NULL` directement. On peut soit :
- Selectionner la colonne et verifier cote client (mais le JSONB peut etre volumineux)
- Utiliser une fonction RPC

L'approche la plus simple : selectionner la colonne dans la requete en la castant en petit format. En realite, PostgREST ne supporte pas le cast. On va donc ajouter le champ dans le select et verifier `!= null` cote client, mais pour eviter de charger le JSONB complet on va creer une **colonne calculee** ou simplement accepter le cout.

Approche retenue : ajouter une requete SQL brute via RPC ou simplement selectionner `proposal_state` dans le fetch mais uniquement pour verifier la presence. Comme PostgREST charge le champ complet, on va plutot ajouter une **database function** qui retourne un boolean.

**Approche finale simplifiee** : Ajouter `proposal_state` au select de `fetchExports`, puis mapper chaque entree pour extraire `has_proposal_state = !!data.proposal_state` avant de stocker. Le JSONB sera charge mais jete immediatement. C'est acceptable pour 200 entrees max.

### 2. Navigation vers l'onglet Donnees apres chargement

Le code dans `Index.tsx` fait deja `setCurrentView('rental-workflow')` apres `loadFromExport`. Le store met `currentStep: 'data'`. Le composant `RentalWorkflow` devrait donc afficher l'etape "data". Verifions que `RentalWorkflow` utilise bien `currentStep` du store.

### Detail des modifications

**`HistoryView.tsx`** :
- Ajouter `proposal_state` au `.select()` de `fetchExports` (ligne ~102)
- Mapper les resultats pour ajouter `has_proposal_state: !!item.proposal_state` et retirer le JSONB
- Ajouter le champ `has_proposal_state` a l'interface `ProposalExportSummary`
- Dans `renderEntry`, griser le bouton Charger quand `has_proposal_state === false` avec un `title` explicatif

**Aucune autre modification necessaire** : le reste du flux (store, navigation, workflow step) est deja en place.

