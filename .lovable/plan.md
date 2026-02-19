
## Ajout d'un fond bleu clair sur la section Saisie

### Modification unique

**Fichier :** `src/components/rental-proposal/ProposalCard.tsx` — ligne 63

La carte **Saisie** (lignes 63–149) est un composant `<Card>` sans classe de couleur de fond. Il suffit d'y ajouter `bg-blue-50 border-blue-100` pour obtenir un fond bleu clair discret, cohérent avec le design épuré de l'application.

La carte **Données** (ligne 152) reste inchangée avec son fond blanc par défaut.

### Détail technique

```
Avant :  <Card>
Après :  <Card className="bg-blue-50 border-blue-100">
```

- `bg-blue-50` → fond bleu très clair (identique à la référence visuelle transmise)
- `border-blue-100` → bordure légèrement teintée pour l'harmonie

Un seul fichier modifié, aucune migration base de données.
