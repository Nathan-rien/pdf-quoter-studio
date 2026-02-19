
## Diagnostic : Bouton "Importer depuis Admin" désactivé

### Cause racine

Le store `useOptionsAdminStore` utilise Zustand avec `persist` (localStorage), mais le chargement depuis la base de données (`loadOptionsFromDB()`) n'est déclenché **qu'à l'intérieur de la page Admin** (`OptionsServicesAdmin.tsx`).

Résultat :
- Un **admin** qui visite la page Admin charge les données → le localStorage se remplit → le bouton fonctionne
- Un **commercial** qui ouvre directement le workflow (sans passer par Admin) a un store vide → `activeAdminOptions.length === 0` → **bouton désactivé**

De plus, le localStorage étant propre à chaque navigateur/session, la version publiée ne bénéficie pas des données déjà chargées sur Lovable.

### Solution : Chargement automatique au montage des composants consommateurs

Au lieu de dépendre du passage par la page Admin, les deux composants qui utilisent les options admin doivent déclencher eux-mêmes le chargement depuis la base si le store est vide.

La solution la plus propre est de créer un **hook `useEnsureOptionsLoaded`** qui :
1. Vérifie si le store contient déjà des options (chargées via localStorage ou précédemment)
2. Si le store est vide, appelle `loadOptionsFromDB()` et peuple le store
3. Expose un état `isLoading` pour l'affichage conditionnel

Ce hook sera utilisé dans les deux composants concernés :
- `src/components/data-editor/sheets/OptionsServicesEditor.tsx`
- `src/components/rental-proposal/RentalDataEditor.tsx`

### Fichiers modifiés

**1. `src/stores/optionsAdminStore.ts`**
- Ajouter un flag `isLoaded` dans le store pour savoir si un chargement DB a déjà été effectué dans cette session
- Ajouter une action `ensureLoaded()` dans le store, qui évite les double-chargements

**2. `src/components/data-editor/sheets/OptionsServicesEditor.tsx`**
- Appeler `ensureLoaded()` au montage via `useEffect`
- Afficher un indicateur de chargement sur le bouton pendant le fetch

**3. `src/components/rental-proposal/RentalDataEditor.tsx`**
- Même chose : appeler `ensureLoaded()` au montage via `useEffect`
- Afficher un indicateur de chargement sur les deux boutons "Importer depuis Admin"

### Implémentation technique

Dans le store, ajout d'un flag `isLoaded` :

```typescript
// Dans le store
isLoaded: false,
ensureLoaded: async () => {
  if (get().isLoaded) return; // Déjà chargé cette session
  const dbOptions = await loadOptionsFromDB();
  if (dbOptions && dbOptions.length > 0) {
    set({ options: dbOptions, isLoaded: true });
  } else {
    set({ isLoaded: true }); // Même si vide, on marque comme chargé
  }
},
```

Dans les composants consommateurs :

```typescript
const { options: adminOptions, ensureLoaded } = useOptionsAdminStore();
const [isLoadingOptions, setIsLoadingOptions] = useState(false);

useEffect(() => {
  setIsLoadingOptions(true);
  ensureLoaded().finally(() => setIsLoadingOptions(false));
}, [ensureLoaded]);

// Bouton
<Button disabled={isLoadingOptions || activeAdminOptions.length === 0}>
  {isLoadingOptions ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
  Importer depuis Admin
</Button>
```

### Comportement après correction

| Scénario | Avant | Après |
|----------|-------|-------|
| Commercial ouvre le workflow directement | Store vide → bouton désactivé | Chargement auto depuis DB → bouton actif |
| Admin revient sur le workflow | Dépend du localStorage | Chargement immédiat (isLoaded=true) |
| Aucune option définie en admin | Bouton désactivé (correct) | Bouton désactivé (correct, avec message) |
| Chargement en cours | Bouton désactivé sans indication | Bouton désactivé + spinner visible |

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/stores/optionsAdminStore.ts` | Ajout de `isLoaded` flag et méthode `ensureLoaded()` |
| `src/components/data-editor/sheets/OptionsServicesEditor.tsx` | Appel `ensureLoaded()` au montage + spinner |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Appel `ensureLoaded()` au montage + spinner sur les 2 boutons |

Aucune migration base de données requise.
