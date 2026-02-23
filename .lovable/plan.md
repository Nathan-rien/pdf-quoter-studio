

## Decaler le logo client sous la date (sans chevaucher)

### Probleme

Le logo client est actuellement positionne a `entityLogo.position.y` (bord superieur du logo entite), ce qui le place au meme niveau vertical que le logo entite et la date. Sur le template Cybertek Pro, cela provoque un chevauchement visible avec le texte de la date.

### Solution

Modifier `autoTopPct` pour positionner le logo client **sous la date** avec une marge, plutot qu'au meme Y que le logo entite. La logique sera :

- Si un element date existe : placer le logo client sous la date (`dateElement.position.y + dateElement.size.height`) + une marge de 2%
- Sinon si un logo entite existe : sous le logo entite + marge
- Sinon : valeur par defaut (6%)

Le centrage horizontal (sous la date) reste inchange.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Modifier `autoTopPct` : positionner sous la date + 2% de marge |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Meme modification pour garantir la parite preview/export |

### Detail technique

**Calcul actuel** :
```text
autoTopPct = entityLogo.position.y / CANVAS_SCALE.height * 100
```

**Nouveau calcul** :
```text
autoTopPct = dateElement
  ? ((dateElement.position.y + dateElement.size.height) / CANVAS_SCALE.height) * 100 + 2
  : entityLogo
    ? ((entityLogo.position.y + entityLogo.size.height) / CANVAS_SCALE.height) * 100 + 1
    : 6
```

### Ce qui ne change pas
- Le centrage horizontal (sous la date via `translateX(-50%)`)
- La taille du logo client (50x50 unites canvas)
- Le mode drag-and-drop et `clientLogoOverride`

