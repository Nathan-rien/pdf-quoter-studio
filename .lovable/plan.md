
## Mise à jour de la valeur par défaut des "Services inclus"

### Diagnostic

La valeur affichée dans "Services inclus" provient du **localStorage** du navigateur via Zustand `persist`. Les deux environnements (Lovable preview et version publiée) n'ont pas le même localStorage, d'où la différence.

- Version publiée (modifiée manuellement) : 6 lignes complètes
- Version Lovable preview (valeur par défaut du code) : seulement 3 lignes

La valeur par défaut se trouve ligne 231 de `src/stores/rentalProposalStore.ts` :

```typescript
const initialServicesInclus: ServicesInclus = {
  description: 'Contrat de location et gestion administrative\nOptimisation des coûts et gestion budgétaire\nGestion des évolutions du parc',
};
```

### Ce qui est modifié

**Fichier unique :** `src/stores/rentalProposalStore.ts`

La valeur `initialServicesInclus` est mise à jour avec les 6 lignes complètes souhaitées :

```
Contrat de location et gestion administrative
Optimisation des coûts et gestion budgétaire
Gestion des évolutions (ajout / retrait de matériels en cours de contrat)
Accès privilégié aux matériels de seconde vie
Garantie de recyclage / valorisation du matériel en fin de vie (DEEE)
Mise à disposition du matériel informatique (location possible au-delà de la durée du contrat)
```

### Impact sur les sessions existantes

Cette modification met à jour uniquement la valeur par défaut utilisée lors d'un premier démarrage ou après un `resetAll` / `startNewProposal`. Les sessions actives avec un localStorage déjà rempli **ne seront pas affectées automatiquement** car Zustand `persist` conserve la valeur stockée.

Pour que la Lovable preview reflète les nouvelles valeurs, il suffira de :
1. Cliquer sur "Nouvelle proposition" dans l'outil, ou
2. Vider le cache du navigateur, ou
3. Ouvrir en navigation privée

A noter : après publication, les futurs utilisateurs auront automatiquement les 6 lignes par défaut.

### Fichier modifié

- `src/stores/rentalProposalStore.ts` — ligne 231 : mise à jour de `initialServicesInclus.description`
