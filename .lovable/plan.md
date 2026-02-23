

## Corriger le positionnement du logo client sur la Page 1

### Probleme

Le changement precedent a centre le logo client horizontalement sur le **centre du logo entite**, ce qui le fait se superposer directement dessus. D'apres la capture de reference, le logo client doit etre :

- **Horizontalement** : centre sous la date (pas sous le logo entite)
- **Verticalement** : au meme niveau que le logo entite (pas sous la date)

### Solution

Modifier le calcul de position automatique dans les deux fichiers :

| Axe | Ancien calcul (cassé) | Nouveau calcul |
|---|---|---|
| **Left (X)** | Centre du logo entité | Centre de l'élément date |
| **Top (Y)** | Sous la date + 1% | Même Y que le logo entité |

### Fichiers modifies

**`src/components/rental-proposal/RentalProposalPreview.tsx`** (lignes 618-625)

```typescript
// autoTopPct : aligner verticalement avec le logo entité
const autoTopPct = entityLogo
  ? (entityLogo.position.y / CANVAS_SCALE.height) * 100
  : dateElement
    ? ((dateElement.position.y + dateElement.size.height) / CANVAS_SCALE.height) * 100 + 1
    : 6;
// autoLeftPct : centrer sous la date
const autoLeftPct = dateElement
  ? ((dateElement.position.x + dateElement.size.width / 2) / CANVAS_SCALE.width) * 100
  : 50;
```

**`src/components/rental-proposal/RentalProposalExport.tsx`** (lignes 280-287)

Meme logique appliquee a l'identique pour garantir la parite preview/export.

### Ce qui ne change pas

- Taille du logo client (50x50 unites canvas)
- Mode drag-and-drop (clientLogoOverride)
- Rendu des autres elements
- `translateX(-50%)` pour le centrage horizontal

