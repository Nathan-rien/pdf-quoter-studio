## Diagnostic

L'erreur affichée — `Échec d'exécuter « removeChild » sur « Node »` — est une erreur classique de React causée par des **extensions de navigateur qui modifient le DOM** :

- Sur votre capture, l'icône **"aA" du traducteur Edge** est active dans la barre d'adresse.
- Le session replay montre aussi `awebChromeHelper` (extension Adblock/AWeb) injecté dans la page.

Ces outils modifient les nœuds de texte directement dans le DOM. Quand React essaie ensuite de mettre à jour ces nœuds, il ne les retrouve pas et plante avec `removeChild` / `insertBefore`. **Ce n'est pas votre cache qui est corrompu** — le cache est innocent.

Le vrai problème est dans `ErrorBoundary.tsx` : dès qu'une erreur `removeChild` apparaît, le code **efface automatiquement `rental-proposal-storage` et `template-editor-storage`** (lignes 33-40). C'est pour cela que l'utilisateur perd tout son travail.

## Correctif (2 fichiers)

### 1. `index.html` — Empêcher les traducteurs de casser React

Ajouter dans `<head>` et sur `<html>` les directives anti-traduction :

```html
<html lang="fr" translate="no">
  <head>
    <meta name="google" content="notranslate" />
    ...
```

Cela neutralise Google Translate, Edge Translate, DeepL, etc. sur l'application (ils n'altèreront plus les nœuds de texte).

### 2. `src/components/ErrorBoundary.tsx` — Ne plus jamais effacer le travail utilisateur

- **Supprimer** le bloc `componentDidCatch` qui efface `rental-proposal-storage` et `template-editor-storage` sur erreurs `removeChild` / `appendChild` / `insertBefore`. Ces erreurs viennent du DOM externe, pas du cache.
- **Remplacer** par un simple log + une tentative de **récupération automatique** : forcer un re-render via `this.setState({ hasError: false })` après un court délai au premier crash, ce qui suffit dans la plupart des cas (React reconstruit l'arbre proprement).
- Garder le bouton **"Rafraîchir la page"** (action sûre).
- **Renommer** le bouton "Effacer le cache et rafraîchir" en **"Réinitialiser (perte des données non sauvegardées)"** avec une `AlertDialog` de confirmation explicite : "Cette action supprimera vos brouillons en cours. Continuer ?". Plus jamais d'effacement silencieux.

### 3. `src/main.tsx` — Validation cache moins agressive

La fonction `validateCache()` efface `rental-proposal-storage` au moindre souci de parsing du **template** storage (lignes 19-21). Découpler : si le parsing de `template-editor-storage` échoue, ne supprimer **que** ce key-là, pas `rental-proposal-storage`.

## Résultat attendu

- Plus de crash `removeChild` causé par les traducteurs navigateur.
- Si un crash imprévu survient malgré tout, **le travail de l'utilisateur reste intact** dans le localStorage ; un simple "Rafraîchir" le restaure.
- L'effacement du cache devient une action manuelle explicite, jamais automatique.

## Hors-scope

- Pas de modification des stores Zustand ni de la logique métier.
- Pas de changement du flux d'authentification ni des données Supabase (l'historique persistant côté serveur n'est pas concerné par ce bug, qui est purement client).
