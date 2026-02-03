
# Plan : Correction de l'affichage des templates

## Resume

Modifications du composant `TemplateSelector.tsx` pour :
1. Supprimer l'affichage du numero de version (v6, v118, etc.)
2. Corriger l'affichage du nombre de pages qui affiche "?" au lieu du nombre reel

## Probleme identifie

Dans le code actuel (lignes 107-116 de TemplateSelector.tsx) :

```typescript
{version && (
  <div className="flex items-center gap-2 mt-2">
    <Badge variant="outline" className="text-xs">
      v{version.versionNumber}
    </Badge>
    <span className="text-xs text-muted-foreground">
      {version.pages.length || '?'} pages
    </span>
  </div>
)}
```

### Probleme 1 : Numero de version
Le badge `v{version.versionNumber}` n'est pas souhaite dans cette vue de selection.

### Probleme 2 : Nombre de pages "?"
L'expression `version.pages.length || '?'` utilise l'operateur OR logique. Quand `pages.length === 0`, la valeur `0` est falsy en JavaScript, donc `'?'` est affiche meme si le tableau existe. De plus, si `pages` est undefined ou vide, cela pose probleme.

## Solution

Modifier les lignes 106-116 pour :
- Supprimer completement le badge de version
- Utiliser une verification explicite pour le nombre de pages
- Afficher le nombre reel de pages ou un fallback si les pages ne sont pas chargees

### Code modifie

```typescript
{/* Informations de version - nombre de pages uniquement */}
{version && (
  <div className="flex items-center gap-2 mt-2">
    <span className="text-xs text-muted-foreground">
      {version.pages && version.pages.length > 0 
        ? `${version.pages.length} pages` 
        : 'Chargement...'}
    </span>
  </div>
)}
```

## Fichier a modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/rental-proposal/TemplateSelector.tsx` | Supprimer le badge version, corriger l'affichage du nombre de pages |

## Resultat attendu

- Plus de badge "v6" ou "v118" affiche sur les cartes de selection
- Affichage correct du nombre de pages (ex: "8 pages") au lieu de "? pages"
