
## Correction de la valeur par défaut de "Services Inclus"

### Cause racine

Il y a deux mécanismes en jeu :

**1. L'isolation du localStorage par domaine**
- Environnement de test : `id-preview--[...].lovable.app`
- Site publié : `pdf-quoter-studio.lovable.app`

Ces deux domaines ont chacun leur propre localStorage **complètement séparé**. Aucune donnée saisie en test n'est jamais transférée vers le site publié. Quand un utilisateur ouvre le site publié, `servicesInclus` n'existe pas encore dans son localStorage → le store Zustand charge `initialServicesInclus`.

**2. La valeur par défaut hardcodée est incorrecte**

Dans `src/stores/rentalProposalStore.ts`, ligne 227 :

```typescript
// ÉTAT ACTUEL — virgules = tout sur une ligne
const initialServicesInclus: ServicesInclus = {
  description: 'Contrat de location et gestion administrative, Optimisation des coûts et gestion budgétaire, Gestion des évolutions du parc',
};
```

Ce texte est séparé par des virgules (`, `) au lieu de sauts de ligne (`\n`). Or le composant de rendu fait un `description.split('\n')` pour afficher chaque ligne comme une puce — avec des virgules, tout s'affiche sur une seule puce.

---

### Solution — Corriger `initialServicesInclus` (ligne 227)

```typescript
// APRÈS — sauts de ligne = 3 puces distinctes
const initialServicesInclus: ServicesInclus = {
  description: 'Contrat de location et gestion administrative\nOptimisation des coûts et gestion budgétaire\nGestion des évolutions du parc',
};
```

Avec cette correction :
- Le site publié affichera immédiatement les 3 services en puces séparées, même sans localStorage
- Les utilisateurs existants dont le localStorage contient encore l'ancienne valeur avec virgules verront l'ancienne version jusqu'à ce qu'ils modifient et sauvegardent le champ (comportement attendu)
- Tout nouvel accès au site publié (ou cache vidé) chargera la bonne valeur par défaut

---

### Résumé

| Fichier | Ligne | Changement |
|---|---|---|
| `src/stores/rentalProposalStore.ts` | 227 | Remplacer `, ` par `\n` dans la description par défaut |

### Pourquoi la persistance seule ne suffisait pas

La correction précédente (ajouter `servicesInclus` dans `partialize`) était nécessaire et correcte — elle garantit que les futures modifications seront conservées. Mais elle ne résout pas le premier chargement sur un nouveau domaine ou un cache vide, où `initialServicesInclus` est toujours utilisée.

Ces deux correctifs sont complémentaires :
- `partialize` → persiste les modifications futures
- `initialServicesInclus` → garantit une valeur par défaut correcte dès le premier chargement
