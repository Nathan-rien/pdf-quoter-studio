

## Analyse de la demande

La demande comporte trois volets :
1. **Cases à cocher interactives** sur les options dans le PDF exporté
2. **Signature électronique** dans le PDF
3. **PDF éditable** par les outils comme Adobe Acrobat

### Contrainte technique majeure

Le PDF est actuellement généré via `window.print()` (impression navigateur), ce qui produit un PDF **plat** (sans champs de formulaire interactifs). Pour obtenir de vrais champs interactifs (checkboxes AcroForm, champ signature numérique), il faudrait migrer vers une bibliothèque PDF comme `pdf-lib` + `jsPDF`, ce qui impliquerait une réécriture complète du moteur de rendu PDF — un chantier très lourd.

### Solution pragmatique proposée

Les PDFs générés via `window.print()` sont **déjà éditables** dans Adobe Acrobat (outil "Remplir et signer"). La solution consiste à :

1. **Page "Bon pour accord"** : Injecter dynamiquement la liste des "Nos Options" sélectionnées avec des cases à cocher visuelles (☐) que le client pourra cocher dans Adobe via "Remplir et signer"
2. **Zone signature** : Ajouter une zone de signature clairement délimitée et labellisée, compatible avec l'outil de signature d'Adobe
3. **Aucune restriction PDF** : Le `window.print()` ne pose aucune restriction de sécurité, le PDF reste modifiable

### Modifications

| Fichier | Changement |
|---|---|
| `RentalProposalExport.tsx` | Ajouter du contenu dynamique sur la dernière page du template : liste des options avec ☐ + zone signature |
| `RentalProposalPreview.tsx` | Refléter les mêmes éléments (liste options + zone signature) sur la dernière page de l'aperçu |

### Contenu injecté sur la dernière page

```text
┌─────────────────────────────────────────┐
│  Bon pour accord                        │
│                                         │
│  Le  /  /                               │
│                                         │
│  Options retenues :                     │
│  ☐ Option A — 50,00 €/mois /machine    │
│  ☐ Option B — 120,00 € /parc           │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Signature et cachet              │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Important : La présente proposition... │
└─────────────────────────────────────────┘
```

### Détail technique

- Les options affichées reprennent les `nosOptions` sélectionnées avec leur prix et scope
- Les cases ☐ sont des caractères Unicode, cochables dans Adobe via "Remplir et signer" → outil Coche (✓)
- La zone signature est un rectangle bordé en pointillés, reconnu par Adobe pour la signature

### Limitation

Cette approche ne fournit pas de **vrais champs de formulaire PDF** (AcroForm). Le client utilise les outils d'annotation d'Adobe pour cocher et signer. Pour des champs AcroForm natifs, il faudrait migrer vers `pdf-lib` + `jsPDF` (chantier estimé à plusieurs jours).

