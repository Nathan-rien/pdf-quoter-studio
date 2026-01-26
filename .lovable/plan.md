
# Plan : Corriger la duplication de template avec lazy loading

## Problème identifié

Lors de la duplication d'un template, si la version source n'a pas encore ses pages chargées (lazy loading), la version dupliquée hérite de `pages: []`. Ensuite, quand on ouvre le template dupliqué :

1. Le système détecte `pages.length === 0`
2. Il appelle `loadVersionPages(version.id)` pour charger depuis le cloud
3. **Erreur 1** : L'ID `version-1769436183828-0` n'est pas converti en UUID valide avant la requête
4. **Erreur 2** : Le template dupliqué n'existe pas encore en base de données (pas synchronisé)

## Solution

Deux corrections sont nécessaires :

### Correction 1 : Convertir l'ID en UUID dans `loadVersionPages`

Dans `src/hooks/useTemplateSync.ts`, modifier la fonction `loadVersionPages` pour utiliser `toValidUUID` :

```typescript
// AVANT
const { data, error } = await supabase
  .from('template_versions')
  .select('pages')
  .eq('id', versionId)  // ID brut
  .maybeSingle();

// APRÈS
const { data, error } = await supabase
  .from('template_versions')
  .select('pages')
  .eq('id', toValidUUID(versionId))  // ID converti en UUID
  .maybeSingle();
```

### Correction 2 : Charger les pages source AVANT la duplication

Dans `src/stores/templateEditorStore.ts`, la fonction `duplicateTemplate` doit s'assurer que les pages source sont chargées. Deux approches possibles :

**Option A (synchrone - recommandée)** : Vérifier si les pages sont vides et utiliser les pages par défaut

```typescript
duplicateTemplate: (templateId, newName, description, includeAllVersions = false) => {
  // ... code existant ...
  
  // Cloner les versions avec nouveaux IDs
  const duplicatedVersions: TemplateVersion[] = versionsToDuplicate.map((v, index) => {
    // Si les pages source sont vides (lazy loading), utiliser les pages par défaut
    const sourcePages = v.pages.length > 0 ? v.pages : createDefaultPages();
    
    return {
      ...v,
      id: `version-${Date.now()}-${index}`,
      templateId: newTemplateId,
      // ... reste du code ...
      pages: sourcePages.map(page => ({
        // ... clonage des pages ...
      }))
    };
  });
}
```

**Option B (alternative)** : Rendre `duplicateTemplate` asynchrone et charger les pages avant duplication

Cette option est plus complexe car elle nécessite de modifier la signature de la fonction et tous ses appels.

### Correction 3 : Ne pas tenter de charger depuis le cloud si la version n'existe pas en base

Ajouter une vérification dans le `useEffect` de `TemplateEditorLayout.tsx` :

```typescript
useEffect(() => {
  const loadPagesIfEmpty = async () => {
    if (
      currentVersion && 
      currentVersion.id && 
      (!currentVersion.pages || currentVersion.pages.length === 0) &&
      !isLoadingVersion
    ) {
      // Ne pas charger si la version n'existe pas encore en base (ID local non synchronisé)
      const isLocalOnlyVersion = currentVersion.id.startsWith('version-');
      
      if (isLocalOnlyVersion) {
        // Version locale : utiliser les pages par défaut
        console.log('Version locale détectée, utilisation des pages par défaut');
        // Mettre à jour avec les pages par défaut
        useTemplateEditorStore.getState().updateCurrentVersionPages(createDefaultPages());
        return;
      }
      
      console.log('Pages vides détectées, chargement depuis le cloud...');
      await loadVersionPages(currentVersion.id);
    }
  };
  
  loadPagesIfEmpty();
}, [currentVersion?.id, currentVersion?.pages?.length, isLoadingVersion, loadVersionPages]);
```

---

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useTemplateSync.ts` | Ligne ~213 : utiliser `toValidUUID(versionId)` dans la requête |
| `src/stores/templateEditorStore.ts` | Ligne ~394 : utiliser `createDefaultPages()` si les pages source sont vides |
| `src/components/template-editor/TemplateEditorLayout.tsx` | Ligne ~97 : ajouter une vérification pour les versions locales |

---

## Flux corrigé

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Utilisateur duplique un template                             │
├─────────────────────────────────────────────────────────────────┤
│ 2. duplicateTemplate() vérifie v.pages                          │
│    → Si vide : utilise createDefaultPages()                     │
│    → Sinon : clone les pages existantes                         │
├─────────────────────────────────────────────────────────────────┤
│ 3. Nouvelle version créée avec pages valides                    │
│    → ID: "version-1769436183828-0"                              │
│    → pages: [Page1, Page2, ..., Page8]                          │
├─────────────────────────────────────────────────────────────────┤
│ 4. Utilisateur ouvre le template dupliqué                       │
│    → pages.length > 0 : pas de chargement cloud nécessaire      │
│    → Canvas affiche les pages correctement                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Résultat attendu

- Le template dupliqué s'ouvre immédiatement avec 8 pages valides
- Aucune erreur "Erreur lors du chargement de la version"
- Le canvas affiche les éléments du template source (ou les éléments par défaut si la source n'était pas chargée)
- La synchronisation vers le cloud fonctionne correctement grâce à `toValidUUID`
