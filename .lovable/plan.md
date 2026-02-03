
## Objectif
Dans l’étape **Sélection du Template**, remplacer l’état permanent **“Chargement…”** par le **nombre réel de pages** (ex: “8 pages”), tout en gardant l’interface simple (pas de numéro de version).

## Constat (cause racine)
- `useTemplateSync.loadFromDatabase()` charge volontairement les **métadonnées** des versions **sans la colonne `pages`** (lazy loading) pour éviter des timeouts.
- Du coup, dans le store, les versions publiées ont `pages: []` au moment où `TemplateSelector` s’affiche.
- `TemplateSelector` affiche alors “Chargement…” tant que `version.pages.length === 0`, mais **ne déclenche jamais** `loadVersionPages()`.
- Résultat : “Chargement…” reste indéfiniment sur les cartes (comme sur votre capture).

## Solution retenue (simple, fiable, alignée avec l’existant)
Ajouter un **lazy loading automatique des pages** dans `TemplateSelector` (comme c’est déjà fait dans `RentalProposalPreview` et `TemplateEditorLayout`) :

1. Au rendu de la liste des templates publiés :
   - identifier la **dernière version publiée** de chaque template
   - si `version.pages.length === 0` et si l’ID ressemble à un ID “cloud” (UUID), déclencher `loadVersionPages(version.id)`
2. Charger **séquentiellement** (une par une) pour éviter les effets de bord liés au booléen global `isLoadingVersion` dans `useTemplateSync`.
3. Empêcher toute boucle infinie :
   - mémoriser les `version.id` déjà demandés (via `useRef(new Set())`)
4. Affichage :
   - si pages chargées : afficher `"{n} pages"`
   - sinon : afficher “Chargement…” (mais cette fois temporaire)

## Changements précis

### 1) `src/components/rental-proposal/TemplateSelector.tsx`
- Récupérer `loadVersionPages` depuis `useTemplateSync()` (en plus de `isLoading`/`hasLoaded`).
- Ajouter une `useEffect` qui précharge les pages des versions publiées visibles :
  - construire une liste `versionsToPreload` à partir des `availableTemplates`
  - filtrer celles dont `pages.length === 0`
  - ignorer les versions locales/démo (ex: IDs qui ne sont pas UUID) pour ne pas faire une requête inutile
  - exécuter `await loadVersionPages(version.id)` en boucle

Exemple de logique (pseudo-code) :
```ts
const requestedRef = useRef(new Set<string>());

useEffect(() => {
  if (!hasLoaded) return;

  const versionsToPreload = availableTemplates
    .map(t => getTemplateLatestVersion(t.id))
    .filter((v): v is TemplateVersion => !!v && v.status === 'publie')
    .filter(v => v.pages.length === 0)
    .filter(v => isUuid(v.id))
    .filter(v => !requestedRef.current.has(v.id));

  let cancelled = false;

  (async () => {
    for (const v of versionsToPreload) {
      if (cancelled) break;
      requestedRef.current.add(v.id);
      await loadVersionPages(v.id);
    }
  })();

  return () => { cancelled = true; };
}, [hasLoaded, availableTemplates, getTemplateLatestVersion, loadVersionPages]);
```

### 2) (Optionnel) Micro-amélioration UI
- Ajouter un petit loader inline (ex: `Loader2` en 12px) à côté de “Chargement…” uniquement pour les cartes concernées.
- Mais ce n’est pas obligatoire : le préchargement suffira déjà à faire apparaître le nombre de pages.

## Tests de validation (end-to-end)
1. Ouvrir **Proposition → étape Template** :
   - vérifier que “Chargement…” disparaît en quelques instants et devient “X pages”.
2. Tester avec 2 templates minimum :
   - vérifier que chaque carte affiche son propre nombre de pages.
3. Vérifier l’étape **Aperçu** :
   - rien ne doit régresser (elle charge déjà les pages en lazy loading).

## Notes techniques / risques
- Cette solution peut déclencher 1 requête par template publié visible. En pratique, c’est acceptable si vous avez peu de templates.
- Si vous prévoyez des dizaines/centaines de templates, on pourra optimiser ensuite via une colonne `pages_count` ou une vue backend “métadonnées + count” pour éviter de récupérer le JSON complet `pages` juste pour compter.
