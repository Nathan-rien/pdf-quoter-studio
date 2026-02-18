
## Correction définitive : `servicesInclus` comme configuration globale persistante

### Cause racine précise

`servicesInclus` est actuellement traité comme une **donnée de proposition** (au même niveau que les lignes produits, le client, la matrice). Résultat : à chaque appel de `startNewProposal()` (ligne 651), le state est réinitialisé avec `...initialState`, qui contient `initialServicesInclus` — effaçant toute modification de l'utilisateur.

```typescript
// ligne 651-656 — écrase servicesInclus à chaque nouvelle proposition
startNewProposal: () => {
  set({
    ...initialState,   // ← servicesInclus revient à la valeur par défaut
    isActive: true,
  });
},
```

La même chose se produit lors de `importFromPDF` si le champ n'est pas explicitement préservé.

`servicesInclus` est conceptuellement un **paramètre de configuration global** (texte standard de l'entreprise), pas une donnée spécifique à chaque proposition client. Il ne devrait jamais être réinitialisé lors du démarrage d'une nouvelle proposition.

---

### Solution — 3 modifications dans `rentalProposalStore.ts`

**1. `startNewProposal` — Préserver `servicesInclus` lors de la réinitialisation**

```typescript
// AVANT
startNewProposal: () => {
  set({
    ...initialState,
    isActive: true,
  });
},

// APRÈS
startNewProposal: () => {
  const currentServicesInclus = get().servicesInclus;
  set({
    ...initialState,
    servicesInclus: currentServicesInclus,  // ← préservé
    isActive: true,
  });
},
```

**2. `importFromPDF` — Préserver `servicesInclus` lors de l'import d'un nouveau PDF**

Dans la fonction `importFromPDF` (ligne 253), le `set({...})` n'inclut pas `servicesInclus`, ce qui laisse la valeur du state précédent en place. Cependant, si `importFromPDF` est appelé après `startNewProposal`, `servicesInclus` a déjà été réinitialisé. En fixant `startNewProposal`, ce cas est couvert.

**3. `resetAll` — Préserver `servicesInclus` lors d'un reset complet**

```typescript
// AVANT
resetAll: () => {
  set(initialState);
},

// APRÈS  
resetAll: () => {
  const currentServicesInclus = get().servicesInclus;
  set({
    ...initialState,
    servicesInclus: currentServicesInclus,  // ← préservé
  });
},
```

---

### Résumé

| Fichier | Fonction | Modification |
|---|---|---|
| `src/stores/rentalProposalStore.ts` | `startNewProposal` | Lire `servicesInclus` avant reset, le réinjecter après |
| `src/stores/rentalProposalStore.ts` | `resetAll` | Même logique |

### Comportement après correction

- L'utilisateur modifie et sauvegarde la description "Services Inclus"
- Il démarre une nouvelle proposition (import d'un nouveau PDF)
- La description "Services Inclus" **reste inchangée**
- Toutes les autres données (client, lignes, matrice) sont bien réinitialisées
- Le texte par défaut (`initialServicesInclus`) n'est utilisé que lors du **tout premier chargement** de l'application (localStorage vide)
