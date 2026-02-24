

## Supprimer les cartes dupliquées du dashboard Proposition

### Modification

Retirer la grille de 3 cartes ("Nouvelle proposition", "Reprendre", "Historique") du composant `RentalProposalDashboard.tsx` tout en conservant :
- La section hero avec le titre "Proposition", la description, et les boutons "Nouvelle proposition" / "Reprendre la proposition en cours"
- Les cartes de statut en bas (Etat actuel, Workflow)

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/components/dashboard/RentalProposalDashboard.tsx` | Supprimer le bloc "Quick Actions Grid" (lignes 65-112 environ) qui contient les 3 cartes redondantes |

### Resultat attendu

La page affichera uniquement :
1. Le bandeau hero avec titre + description + boutons d'action
2. Les cartes de statut (Etat actuel / Workflow)

Les boutons "Historique" restent accessibles via la sidebar.

