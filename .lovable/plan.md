

## Aligner le rendu des descriptions "Nos Options" entre Preview et PDF

### Probleme

Dans l'export PDF (`RentalProposalExport.tsx`, ligne 468), la description des options est affichee dans une seule balise `<p>` brute :

```html
<p style="...">${opt.description}</p>
```

Resultat : tout le texte s'affiche en un seul bloc sans retours a la ligne, sans puces, sans indentation des sous-items.

Dans la preview (`RentalProposalPreview.tsx`, lignes 967-976), la description est decoupee par `\n` et chaque ligne recoit :
- Un bullet `*` si c'est une ligne principale
- Une indentation `pl-3` si la ligne commence par `- ` (sous-item)

### Solution

Remplacer la balise `<p>` unique dans le HTML d'export par la meme logique de decoupe et de formatage que la preview.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` (ligne 468) | Remplacer le rendu brut par un rendu ligne par ligne avec bullets et indentation |

### Code cible (ligne 468)

Remplacer :
```html
<p style="color: #6b7280; font-size: 8px; margin: 0 0 0 16px;">${opt.description}</p>
```

Par :
```html
<div style="color: #6b7280; font-size: 8px; margin: 0 0 0 16px;">
  ${opt.description.split('\n').filter(l => l.trim()).map(line => {
    const trimmed = line.trim();
    const isSubItem = trimmed.startsWith('- ');
    return `<div style="line-height: 1.4; ${isSubItem ? 'padding-left: 10px;' : ''}">${isSubItem ? trimmed : '• ' + trimmed}</div>`;
  }).join('')}
</div>
```

Cela reproduit exactement la logique de la preview : decoupe par `\n`, filtrage des lignes vides, bullet pour les lignes principales, indentation pour les sous-items commencant par `- `.

### Comportement attendu

- **Preview** : lignes avec `*` et sous-items indentes (inchange)
- **PDF export** : meme rendu avec bullets et indentation, au lieu d'un bloc de texte continu

