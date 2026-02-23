

## Bouton "+" d'insertion de separateur entre chaque ligne

### Objectif

Remplacer le bouton "Separation" du header par des boutons "+" discrets positionnes entre chaque ligne du tableau Invest, permettant d'inserer une ligne de separation exactement a l'endroit souhaite.

### Modifications

**Fichier : `src/stores/rentalProposalStore.ts`**

- Modifier `addSeparatorLigne` pour accepter un parametre optionnel `atIndex?: number` qui insere le separateur a une position precise (au lieu de toujours l'ajouter en fin de liste)

**Fichier : `src/components/rental-proposal/RentalDataEditor.tsx`**

1. **Supprimer** le bouton "Separation" du header (lignes 731-734)

2. **Ajouter une ligne intermediaire entre chaque ligne du tableau** : apres chaque `TableRow` (produit ou separateur), afficher une micro-ligne contenant un bouton "+" centre, qui insere un separateur a la position `index + 1`

3. **Style du bouton "+"** :
   - Ligne de hauteur reduite (~20px), fond transparent
   - Bouton circulaire discret (icone `Plus`, taille 16px) centre horizontalement
   - Visible au survol de la zone uniquement (opacity 0 par defaut, opacity 100 au hover du `TableRow` intermediaire)
   - Meme colonne que la poignee de drag (premiere colonne), ou bien `colSpan` sur toute la largeur avec le bouton centre

4. **Ajouter aussi un bouton "+" avant la premiere ligne** pour pouvoir inserer un separateur tout en haut

### Rendu visuel attendu

```text
[+ btn discret]          <-- insert separateur en position 0
[grip] Ligne produit 1
[+ btn discret]          <-- insert separateur en position 1
[grip] Ligne produit 2
[+ btn discret]          <-- insert separateur en position 2
[grip] Separateur bleu
[+ btn discret]          <-- insert separateur en position 3
[grip] Ligne produit 3
```

### Resume technique

| Fichier | Modification |
|---|---|
| `src/stores/rentalProposalStore.ts` | Parametre `atIndex` dans `addSeparatorLigne` |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Retrait bouton header, ajout lignes intermediaires avec bouton "+" |

