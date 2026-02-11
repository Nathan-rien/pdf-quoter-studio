
## Correction : substitution des frais de dossier dans les elements en flux relatif (Page 4)

### Probleme identifie

Sur la page 4, les elements texte situes sous la zone dynamique (tableau produits) sont rendus par la fonction `renderFlowElement` (ligne 708-713 de `RentalProposalPreview.tsx`). Cette fonction affiche le texte brut **sans appeler** `substituteDynamicPlaceholders`, contrairement a `renderTextContent` qui applique bien la substitution.

Le texte "Frais de dossier bancaire" se trouve dans un element rendu par `renderFlowElement`, donc le placeholder `{{FRAIS_DOSSIER}}` et l'auto-detection ne se declenchent jamais.

### Correction

**Fichier** : `src/components/rental-proposal/RentalProposalPreview.tsx`

**Fonction** : `renderFlowElement` (lignes ~708-713)

Ajouter l'appel a `substituteDynamicPlaceholders` sur le contenu HTML et le texte brut, avec le contexte `{ fraisDossier: calculatedValues.fraisDossier }` :

```text
Avant (ligne 709-713):
  {content.htmlContent ? (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.htmlContent) }} />
  ) : (
    content.text || ''
  )}

Apres:
  {content.htmlContent ? (
    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(
      substituteDynamicPlaceholders(content.htmlContent, { fraisDossier: calculatedValues.fraisDossier })
    ) }} />
  ) : (
    substituteDynamicPlaceholders(content.text || '', { fraisDossier: calculatedValues.fraisDossier })
  )}
```

### Impact
- Correction ciblee sur 4 lignes dans une seule fonction
- Les dates (`{{DATE}}`) seront egalement substituees dans ces elements (coherence)
- Aucune regression sur les autres pages
