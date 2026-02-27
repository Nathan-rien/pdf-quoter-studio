

## Renommer le fichier PDF exporté

### Modification

| Fichier | Ligne | Changement |
|---|---|---|
| `RentalProposalExport.tsx` | 78-83 | Modifier `generateFileName()` pour produire `Proposition_commerciale_{nom_client}_{date}.pdf` en utilisant `clientData.nom` |

### Nouvelle logique

```typescript
const generateFileName = () => {
  const clientName = clientData.nom || 'Client';
  const safeName = clientName.replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '').replace(/\s+/g, '_');
  const date = new Date().toISOString().split('T')[0];
  return `Proposition_commerciale_${safeName}_${date}.pdf`;
};
```

Le nom du fichier sera par exemple : `Proposition_commerciale_Dupont_SAS_2026-02-27.pdf`

