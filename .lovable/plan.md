

# Plan : Afficher la date complète au format "02 février 2026"

## Modification à effectuer

Mettre à jour la fonction `getCurrentDateFR()` dans `src/lib/template-render-utils.ts` pour retourner la date complète avec le jour.

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/template-render-utils.ts` | Modifier `getCurrentDateFR()` pour inclure le jour du mois |

## Détail de la modification

### Fonction actuelle (lignes 21-24)

```typescript
export const getCurrentDateFR = (): string => {
  const now = new Date();
  return `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;
};
```

### Nouvelle version

```typescript
export const getCurrentDateFR = (): string => {
  const now = new Date();
  const jour = now.getDate().toString().padStart(2, '0');
  const mois = MOIS_FR[now.getMonth()].toLowerCase();
  return `${jour} ${mois} ${now.getFullYear()}`;
};
```

## Format de sortie

| Avant | Après |
|-------|-------|
| Février 2026 | 02 février 2026 |
| Mars 2026 | 15 mars 2026 |

## Impact

Cette modification affectera automatiquement :
- L'aperçu de proposition (Page 1)
- L'export PDF
- Toutes les occurrences de `{{DATE}}` dans les templates
- La substitution automatique des anciennes dates "Mois 20XX"

