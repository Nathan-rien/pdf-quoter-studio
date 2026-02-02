

# Plan : Corriger le chargement du template Grosbill dans l'aperçu de proposition

## Probleme identifie

L'aperçu de la proposition n'affiche pas le template Grosbill car le **lazy loading des pages** utilise le mauvais template.

**Cause racine dans `src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes 120-159) :

```typescript
// ACTUEL - INCORRECT
const template = getActiveTemplate();  // ← Retourne le template actif de l'ÉDITEUR (CybertekPro)

// ATTENDU - CORRECT
// Devrait utiliser activeTemplate qui est basé sur selectedTemplateId du proposal store
```

## Flux du bug

```text
1. Utilisateur sélectionne "Grosbill" dans le workflow Proposition
   ↓
2. selectedTemplateId = "086b1fd6-..." (ID Grosbill) ✓
   ↓
3. activeTemplate (memo local) = template Grosbill ✓
   ↓
4. useEffect loadPages() appelle getActiveTemplate()
   ↓
5. getActiveTemplate() retourne le template actif de l'ÉDITEUR (CybertekPro) ✗
   ↓
6. Lazy loading charge les pages de CybertekPro au lieu de Grosbill ✗
   ↓
7. getStaticPageElements() utilise correctement activeTemplate (Grosbill)
   mais les pages Grosbill n'ont jamais été chargées → tableau vide
   ↓
8. Affichage = contenu par défaut sans style du template
```

## Solution

Modifier l'effet `loadPages` pour utiliser le `activeTemplate` local (qui respecte `selectedTemplateId`) au lieu de `getActiveTemplate()` (qui renvoie le template actif de l'éditeur).

## Fichier a modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Corriger l'effet `loadPages` pour utiliser `activeTemplate` et ajouter `selectedTemplateId` aux dépendances |

## Detail des modifications

### Lignes 120-159 : Corriger le lazy loading

**AVANT** :
```typescript
React.useEffect(() => {
  const loadPages = async () => {
    if (!hasLoaded) return;
    if (pagesLoaded) return;
    
    const template = getActiveTemplate();  // ← BUG
    if (!template) {
      setPagesLoaded(true);
      return;
    }
    
    const version = getTemplateLatestVersion(template.id);
    ...
  };
  
  loadPages();
}, [hasLoaded, pagesLoaded, getActiveTemplate, getTemplateLatestVersion, loadVersionPages]);
```

**APRES** :
```typescript
React.useEffect(() => {
  const loadPages = async () => {
    if (!hasLoaded) return;
    
    // Utiliser activeTemplate (basé sur selectedTemplateId) et non getActiveTemplate()
    if (!activeTemplate) {
      setPagesLoaded(true);
      return;
    }
    
    const version = getTemplateLatestVersion(activeTemplate.id);
    if (!version) {
      setPagesLoaded(true);
      return;
    }
    
    // Si les pages ne sont pas chargées (lazy loading), les charger depuis le cloud
    if (version.pages.length === 0) {
      console.log('[RentalProposalPreview] Lazy loading pages for version:', version.id, 'template:', activeTemplate.name);
      const loadedPages = await loadVersionPages(version.id);
      
      if (loadedPages && loadedPages.length > 0) {
        console.log('[RentalProposalPreview] Pages loaded successfully:', loadedPages.length, 'pages');
        setPagesLoaded(true);
      } else {
        console.warn('[RentalProposalPreview] No pages loaded, will retry');
      }
      return;
    }
    
    console.log('[RentalProposalPreview] Pages already in store:', version.pages.length, 'pages');
    setPagesLoaded(true);
  };
  
  // Reset pagesLoaded si le template sélectionné change
  setPagesLoaded(false);
  loadPages();
}, [hasLoaded, activeTemplate, getTemplateLatestVersion, loadVersionPages]);
```

### Changements cles

1. **Utiliser `activeTemplate`** au lieu de `getActiveTemplate()` pour respecter le template sélectionné dans le workflow de proposition
2. **Ajouter `activeTemplate` aux dépendances** pour déclencher un rechargement quand l'utilisateur change de template
3. **Retirer `pagesLoaded` des dépendances** et appeler `setPagesLoaded(false)` au début de l'effet pour forcer le rechargement quand le template change
4. **Améliorer les logs** pour indiquer quel template est chargé

## Resultat attendu

| Avant | Apres |
|-------|-------|
| Template Grosbill non chargé, aperçu vide avec texte par défaut | Template Grosbill correctement affiché avec tous les éléments stylisés |
| Logs : "No version or empty pages" | Logs : "Pages loaded successfully: 8 pages" pour Grosbill |

## Tests a effectuer

1. Accéder au workflow Proposition avec un devis importé
2. Sélectionner le template "Proposition Commerciale GrosbillPro"
3. Vérifier que l'aperçu affiche correctement le style Grosbill (fond coloré, logos, etc.)
4. Vérifier que le changement de template (Cybertek ↔ Grosbill) recharge correctement les pages

