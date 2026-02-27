

## Ajouter une zone de signature visible sur la page "Bon pour accord"

### Problème
La page "Bon pour accord" est 100% statique — elle affiche uniquement les éléments du template (titre, "Le / /", "Signature et cachet" en texte, mentions légales). Il n'y a aucune zone visuellement délimitée pour la signature (rectangle en pointillés).

### Solution
Injecter dynamiquement **uniquement** une zone de signature (rectangle en pointillés avec label) sous le titre "Signature et cachet", sans cases à cocher d'options. Cette zone sera reconnue par Adobe Acrobat pour la fonctionnalité "Remplir et signer".

### Modifications

| Fichier | Changement |
|---|---|
| `RentalProposalPreview.tsx` | Remplacer `renderGenericStaticPage` pour la dernière page par une fonction dédiée qui ajoute un rectangle en pointillés sous les éléments statiques |
| `RentalProposalExport.tsx` | Injecter sur la dernière page un bloc HTML contenant uniquement la zone de signature (rectangle `border: 2px dashed`, ~120px de hauteur) |

### Rendu visuel attendu

```text
Bon pour accord
Le  /  /
Signature et cachet

┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                   │
│    (zone signature vide)          │
│                                   │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

Important : La présente proposition...
```

### Détail technique
- Le rectangle est positionné via une zone dynamique sous le titre "Signature et cachet" existant dans le template
- Style : `border: 2px dashed #9ca3af; border-radius: 8px; min-height: 120px;`
- Pas de cases à cocher d'options (celles-ci restent sur la page "Nos Options")

