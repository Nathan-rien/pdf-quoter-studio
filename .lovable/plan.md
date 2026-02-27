

## Correction du positionnement de la zone de signature dans le PDF exporté

### Problème
La zone de signature injectée dans le PDF est ajoutée en fin de flux dans le conteneur `.page` (positionné en absolu). Elle n'a pas de coordonnées explicites, ce qui la place par défaut en haut à gauche ou en fin de flux, chevauchant les mentions légales.

### Solution
Positionner la zone de signature en absolu avec des coordonnées `top`/`left`/`width` cohérentes avec le template — sous le texte "Signature et cachet" et au-dessus du bloc "Important".

### Modifications

| Fichier | Changement |
|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` (lignes 675-687) | Remplacer le `div` de signature par un bloc positionné en absolu (`position: absolute; top: 28%; left: 8%; width: 84%`) pour s'insérer entre "Signature et cachet" et les mentions légales |
| `src/components/rental-proposal/RentalProposalPreview.tsx` (lignes ~1410-1430) | Ajuster le `top` de la zone de signature dans l'aperçu pour correspondre au positionnement PDF (passer de `42%` à `28%` environ, selon l'emplacement réel du texte "Signature et cachet" dans le template) |

### Détail
- La zone de signature utilise `position: absolute` avec `top: 28%` pour se caler juste sous "Signature et cachet" (qui se trouve dans le premier tiers de la page)
- Le `width: 84%` et `left: 8%` centrent la zone horizontalement avec des marges symétriques
- Le style reste : `border: 2px dashed #9ca3af; border-radius: 8px; min-height: 120px`

