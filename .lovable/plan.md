
## Correction : Persistance du champ "Services Inclus"

### Diagnostic précis

Dans `src/stores/rentalProposalStore.ts`, le store utilise Zustand `persist` avec une fonction `partialize` qui définit **explicitement quels champs sont sauvegardés en localStorage**.

Le champ `servicesInclus` est **absent de cette liste** (lignes 660-673) :

```typescript
partialize: (state) => ({
  pdfImportStatus: state.pdfImportStatus,
  clientData: state.clientData,
  commercialData: state.commercialData,
  matriceData: state.matriceData,
  proposals: state.proposals,
  lignesData: state.lignesData,
  optionsServices: state.optionsServices,
  nosOptions: state.nosOptions,
  proposalName: state.proposalName,
  selectedTemplateId: state.selectedTemplateId,
  currentStep: state.currentStep,
  isActive: state.isActive,
  // ← servicesInclus MANQUANT !
}),
```

Résultat : chaque rechargement de page (ou navigation) réinitialise `servicesInclus.description` à la valeur par défaut codée en dur :
```typescript
const initialServicesInclus: ServicesInclus = {
  description: 'Contrat de location et gestion administrative, Optimisation des coûts et gestion budgétaire, Gestion des évolutions du parc',
};
```

Pourtant, `updateServicesInclus` fonctionne correctement (ligne 470-475) — les modifications sont bien appliquées dans le state Zustand en mémoire, mais elles ne sont pas écrites dans le localStorage. Donc le bouton "Sauvegarder" déclenche uniquement `markAsSaved()` (qui met `hasUnsavedChanges: false`) sans jamais persister `servicesInclus`.

---

### Solution — 1 ligne ajoutée

**`src/stores/rentalProposalStore.ts`, dans la fonction `partialize` (ligne ~673)**

Ajouter `servicesInclus: state.servicesInclus` :

```typescript
partialize: (state) => ({
  pdfImportStatus: state.pdfImportStatus,
  clientData: state.clientData,
  commercialData: state.commercialData,
  matriceData: state.matriceData,
  proposals: state.proposals,
  lignesData: state.lignesData,
  servicesInclus: state.servicesInclus,   // ← AJOUT
  optionsServices: state.optionsServices,
  nosOptions: state.nosOptions,
  proposalName: state.proposalName,
  selectedTemplateId: state.selectedTemplateId,
  currentStep: state.currentStep,
  isActive: state.isActive,
}),
```

Il faudra également ajouter la validation de `servicesInclus` dans le bloc `onRehydrateStorage` pour protéger contre les données corrompues :

```typescript
// Validate servicesInclus
if (!state.servicesInclus || typeof state.servicesInclus.description !== 'string') {
  state.servicesInclus = initialServicesInclus;
}
```

---

### Résumé

| Fichier | Changement |
|---|---|
| `src/stores/rentalProposalStore.ts` | Ajout de `servicesInclus` dans `partialize` + validation dans `onRehydrateStorage` |

### Impact

- Les modifications du champ "Services inclus" seront désormais persistées en localStorage à chaque changement
- Elles survivront aux rechargements de page, à la navigation entre les onglets du workflow, et aux sessions
- Aucun effet sur les autres champs ni sur l'aperçu ou le PDF
