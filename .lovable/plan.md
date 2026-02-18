
## Adapter la taille des champs de description aux Options Services

### Diagnostic

Le champ "Description" dans les blocs "Options disponibles" (Page 5, ligne 497) et "Nos Options" (Page 6, ligne 606) de `RentalDataEditor.tsx` utilise le composant `<Textarea>` standard. Ce composant a une hauteur fixe minimale de 80px (définie dans `src/components/ui/textarea.tsx`), ce qui tronque les descriptions multi-lignes importées depuis l'Administration — comme visible dans la capture d'écran où la 3ème ligne de "Pro-Actif" est coupée.

Le composant `<AutoResizeTextarea>` existe déjà dans le projet (`src/components/ui/auto-resize-textarea.tsx`) et est déjà utilisé dans la même page pour la colonne "Désignation" du tableau Invest. Il ajuste dynamiquement sa hauteur en fonction du contenu via `scrollHeight`.

---

### Solution — Remplacement de `<Textarea>` par `<AutoResizeTextarea>`

2 occurrences à remplacer dans `src/components/rental-proposal/RentalDataEditor.tsx` :

**Occurrence 1 — Page 5 "Options disponibles" (lignes ~497-503)**

```tsx
// AVANT
<Textarea
  placeholder="Description"
  value={opt.description}
  onChange={(e) => updateOptionService(opt.id, { description: e.target.value })}
  className="flex-1 text-sm"
/>

// APRÈS
<AutoResizeTextarea
  placeholder="Description"
  value={opt.description}
  onChange={(e) => updateOptionService(opt.id, { description: e.target.value })}
  className="flex-1 text-sm"
/>
```

**Occurrence 2 — Page 6 "Nos Options" (lignes ~606-612)**

```tsx
// AVANT
<Textarea
  placeholder="Description"
  value={opt.description}
  onChange={(e) => updateNosOption(opt.id, { description: e.target.value })}
  className="flex-1 text-sm"
/>

// APRÈS
<AutoResizeTextarea
  placeholder="Description"
  value={opt.description}
  onChange={(e) => updateNosOption(opt.id, { description: e.target.value })}
  className="flex-1 text-sm"
/>
```

---

### Résumé

| Fichier | Changement |
|---|---|
| `src/components/rental-proposal/RentalDataEditor.tsx` | Remplacement de 2 `<Textarea>` par `<AutoResizeTextarea>` (imports déjà présents) |

L'import `AutoResizeTextarea` est déjà présent ligne 6 du fichier — aucun ajout d'import nécessaire.

### Impact attendu

- Les champs de description s'élargissent automatiquement pour afficher toutes les lignes importées depuis l'Admin, sans scrollbar ni troncature
- Le comportement est cohérent avec le champ "Désignation" du tableau Invest
- Aucun effet sur l'aperçu ou l'export PDF
