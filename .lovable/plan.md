

## Diagnostic des options qui n'apparaissent plus

### Analyse du code preview (RentalProposalPreview.tsx)

Le routing de la page 6 est correct :
- `currentPreviewPage = 6` → pas dans la plage invest → pas dans la plage services → `realPageNum = 6` → vérifie `pageExists` (oui, 36 éléments) → `realPageNum === optionsPageNum` (6 === 6) → appelle `renderNosOptionsPage(6)` → itère `nosOptions.map(...)`.

Le code preview **devrait** fonctionner. Le problème pourrait être un rafraîchissement incomplet du HMR après les modifications.

### Problème confirmé dans l'export (RentalProposalExport.tsx)

L'export a exactement le même bug de **duplication** que j'ai corrigé dans le preview : les `selectedNosOptions` sont incluses dans les `servicesBlocs` de l'export (ligne 618-619) ET rendues sur la page "Nos Options" dédiée (ligne 693-702).

### Corrections

#### 1. Export : retirer les nosOptions des servicesBlocs (RentalProposalExport.tsx, lignes 616-619)

```typescript
// Avant :
const servicesBlocs = [
  { type: 'services-location' },
  ...selectedOptions.map(o => ({ type: 'option', html: makeOptionHTML(o) })),
  ...(selectedNosOptions.length > 0 ? [{ type: 'nos-options-title' }] : []),
  ...selectedNosOptions.map(o => ({ type: 'nos-option', html: makeNosOptionHTML(o) })),
];

// Après :
const servicesBlocs = [
  { type: 'services-location' },
  ...selectedOptions.map(o => ({ type: 'option', html: makeOptionHTML(o) })),
];
```

#### 2. Preview : vérifier que la page 6 se charge correctement

Ajouter un `console.log` temporaire dans `renderNosOptionsPage` pour confirmer que le rendu est bien appelé et que `nosOptions` contient des données, puis le retirer une fois le bug vérifié.

Si le problème persiste dans l'aperçu après un rafraîchissement complet du navigateur, il faudra investiguer plus en profondeur (ex: `nosOptions` vidé par une action utilisateur, ou zone `options_block` non définie dans le template).

