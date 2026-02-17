

## Supprimer le fond bleu des cartes "Nos Options" dans l'export PDF

### Probleme

Dans `RentalProposalExport.tsx` (lignes 460-478), les cartes "Nos options" utilisent des couleurs de fond bleues opaques :
- Carte : `background-color: #eff6ff; border: 1px solid #bfdbfe`
- Header : `background-color: #dbeafe`
- Prix : `color: #2563eb`

L'Apercu utilise des teintes tres subtiles (`bg-primary/5`, `bg-primary/15`) qui apparaissent quasi-blanches. Le PDF est donc visuellement plus bleu que l'Apercu.

### Solution

Aligner les couleurs de l'export sur celles de l'Apercu en utilisant des equivalents rgba tres subtils :

| Element | Avant (Export) | Apres (aligne Apercu) |
|---|---|---|
| Fond carte | `#eff6ff` | `rgba(59,130,246,0.05)` |
| Bordure carte | `#bfdbfe` | `rgba(59,130,246,0.2)` |
| Fond header | `#dbeafe` | `rgba(59,130,246,0.15)` |
| Fond description | (inclus dans header) | `#ffffff` |
| Couleur prix | `#2563eb` | `#374151` (gris neutre) |

### Fichier modifie

| Fichier | Lignes | Modification |
|---|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` | 460-478 | Remplacer les couleurs bleues par des teintes subtiles alignees sur l'Apercu |

### Comportement attendu

- Les cartes "Nos options" dans le PDF auront le meme rendu visuel neutre que dans l'Apercu
- Fond quasi-blanc, bordure tres legere, pas de bandeau bleu visible

