
# Plan : Charger les pages source avant duplication

## Problème identifié

Lors de la duplication du template CybertekPro vers GrosbillPro :

1. Les pages de la version source ne sont pas chargées en mémoire (lazy loading)
2. `duplicateTemplate()` est **synchrone** et détecte `v.pages.length === 0`
3. Le fallback utilise `PDF_TEMPLATE_ELEMENTS` = éléments par défaut (placeholder "Image", textes basiques)
4. Le template dupliqué affiche le design par défaut au lieu du design personnalisé de CybertekPro

**Résultat** : Le template dupliqué n'hérite pas du contenu visuel du template source.

---

## Solution

Rendre la duplication **asynchrone** pour charger les pages depuis le cloud AVANT de les cloner.

### Flux corrigé

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Utilisateur clique "Dupliquer"                               │
├─────────────────────────────────────────────────────────────────┤
│ 2. Identifier la version source à dupliquer                     │
├─────────────────────────────────────────────────────────────────┤
│ 3. Si pages.length === 0 (lazy loading)                         │
│    → Charger les pages depuis le cloud via loadVersionPages()   │
│    → Attendre le résultat                                       │
├─────────────────────────────────────────────────────────────────┤
│ 4. Dupliquer avec les VRAIES pages (design personnalisé)        │
│    → Cloner les éléments, zones dynamiques, etc.                │
├─────────────────────────────────────────────────────────────────┤
│ 5. Template dupliqué = copie fidèle du template source          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Modifications prévues

### 1. `src/stores/templateEditorStore.ts` - Rendre `duplicateTemplate` asynchrone

Modifier la fonction pour accepter un paramètre optionnel `sourcePages` chargées au préalable :

```typescript
// AVANT
duplicateTemplate: (templateId, newName, description, includeAllVersions = false) => {
  // ... synchrone, utilise fallback si pages vides
}

// APRÈS
duplicateTemplate: (templateId, newName, description, includeAllVersions = false, preloadedPages?: Record<string, TemplatePageContent[]>) => {
  // ... utilise preloadedPages si fourni, sinon fallback
}
```

### 2. `src/components/template-editor/DuplicateTemplateDialog.tsx` - Charger les pages avant

Modifier `handleDuplicate` pour :
1. Identifier les versions à dupliquer
2. Pour chaque version avec `pages.length === 0`, charger les pages depuis le cloud
3. Passer les pages chargées à `duplicateTemplate()`

```typescript
const handleDuplicate = async () => {
  setIsLoading(true);
  
  // 1. Récupérer les versions du template source
  const sourceVersions = allVersions.filter(v => v.templateId === template.id);
  const versionToDuplicate = getLatestPublishedOrLatest(sourceVersions);
  
  // 2. Si pages non chargées, les charger depuis le cloud
  let preloadedPages: Record<string, TemplatePageContent[]> = {};
  
  if (versionToDuplicate && (!versionToDuplicate.pages || versionToDuplicate.pages.length === 0)) {
    const pages = await loadVersionPages(versionToDuplicate.id);
    if (pages) {
      preloadedPages[versionToDuplicate.id] = pages;
    }
  }
  
  // 3. Dupliquer avec les pages préchargées
  const newTemplate = duplicateTemplate(template.id, name, description, includeAllVersions, preloadedPages);
};
```

### 3. `src/stores/templateEditorStore.ts` - Utiliser les pages préchargées

Dans `duplicateTemplate`, utiliser les pages préchargées si disponibles :

```typescript
const duplicatedVersions = versionsToDuplicate.map((v, index) => {
  // Priorité : pages préchargées > pages en mémoire > pages par défaut
  const sourcePages = 
    (preloadedPages && preloadedPages[v.id]) || 
    (v.pages && v.pages.length > 0 ? v.pages : null) ||
    createDefaultPages();
  
  return {
    // ... clonage avec sourcePages
  };
});
```

---

## Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/stores/templateEditorStore.ts` | Ajouter paramètre `preloadedPages` à `duplicateTemplate` |
| `src/components/template-editor/DuplicateTemplateDialog.tsx` | Charger les pages depuis le cloud avant de dupliquer |

---

## Détails techniques

### Accès à `loadVersionPages` dans le Dialog

Le Dialog doit importer `useTemplateSync` pour accéder à `loadVersionPages` :

```typescript
import { useTemplateSync } from '@/hooks/useTemplateSync';

// Dans le composant
const { loadVersionPages } = useTemplateSync();
```

### Gestion du chargement

Le bouton "Dupliquer" affichera "Chargement..." puis "Duplication..." pour indiquer les deux phases.

### Fallback de sécurité

Si le chargement des pages échoue (erreur réseau, version inexistante), on conserve le fallback vers les pages par défaut pour éviter un blocage.

---

## Résultat attendu

| Élément | Avant | Après |
|---------|-------|-------|
| Page 1 GrosbillPro | Placeholder "Image" + textes basiques | Image de fond + design CybertekPro |
| Nombre de pages | 6 (défaut) | 8 (comme source) |
| Éléments | Par défaut | Copie fidèle du template source |
| Logo | Absent | Présent (comme source) |
