

## Injection dynamique des frais de dossier bancaire

### Objectif
Remplacer le montant en dur "60,00 EUR HT" dans le texte "Frais de dossier bancaire" (pages 4 et 5 du template) par une valeur calculee automatiquement selon le refinanceur selectionne.

### Approche
Utiliser un placeholder `{{FRAIS_DOSSIER}}` dans le texte du template, substitue dynamiquement lors du rendu (apercu et export PDF).

### Modifications

**1. Template par defaut** (`src/lib/pdf-template-elements.ts`)
- Page 4 (`p4_conditions_text`) : remplacer le texte par :
  `"... Frais de dossier bancaire {{FRAIS_DOSSIER}} EUR HT."`

**2. Moteur de substitution** (`src/lib/template-render-utils.ts`)
- Etendre `substituteDynamicPlaceholders` pour accepter un contexte optionnel :
  ```text
  substituteDynamicPlaceholders(text, context?: { fraisDossier?: number | null })
  ```
- Ajouter le remplacement de `{{FRAIS_DOSSIER}}` par la valeur formatee (ex: "60,00", "0") ou "–" si non disponible

**3. Apercu** (`src/components/rental-proposal/RentalProposalPreview.tsx`)
- Passer `{ fraisDossier: calculatedValues.fraisDossier }` en contexte a `substituteDynamicPlaceholders`
- Cela concerne les deux appels dans `renderTextContent` (lignes ~254 et ~264)

**4. Export PDF** (`src/lib/pdf-html-generator.ts`)
- Propager le contexte fraisDossier dans les appels a `substituteDynamicPlaceholders` (lignes ~157 et ~163)
- Ajouter un parametre optionnel `context` a la fonction `renderTextContent` du generateur

**5. Canvas editable** (`src/components/rental-proposal/PreviewEditableCanvas.tsx`)
- Pas de substitution ici (mode edition) : le placeholder `{{FRAIS_DOSSIER}}` reste visible tel quel, ce qui est coherent avec le comportement existant de `{{DATE}}`

### Formatage
- `fraisDossier = 0` affiche "0"
- `fraisDossier = 60` affiche "60,00"
- `fraisDossier = 118` affiche "118,00"
- `fraisDossier = null` affiche "–"

### Impact
- Aucune regression sur les autres placeholders (`{{DATE}}`)
- Les templates existants deja publies conservent leur texte en dur (seul le template par defaut est modifie)
- La logique de lookup `getFraisDossier` existante est reutilisee sans modification
