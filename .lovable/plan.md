
## Retirer le Switch doublon "Coût locatif annuel" dans la carte Données

### Problème

Le toggle Switch "Coût locatif annuel" apparaît en doublon : une fois en haut de la section (bouton principal) et une fois à côté du champ dans la carte "Données" de chaque ProposalCard. Seul celui du haut doit être conservé.

### Modification

| Fichier | Changement |
|---|---|
| `src/components/rental-proposal/ProposalCard.tsx` | Retirer le composant `Switch` à l'intérieur du bloc "Coût locatif annuel" dans la section Données (lignes 163-168), en gardant uniquement le label simple et la valeur affichée |

### Détail technique

Dans `ProposalCard.tsx`, remplacer le bloc contenant le `Switch` intégré au label par un simple label :

Avant :
```text
<div className="flex items-center justify-between">
  <Label className="text-xs text-muted-foreground">Coût locatif annuel</Label>
  <Switch
    checked={showCoutLocatifAnnuel}
    onCheckedChange={onToggleCoutLocatif}
    className="scale-75"
  />
</div>
```

Après :
```text
<Label className="text-xs text-muted-foreground">Coût locatif annuel</Label>
```

L'import de `Switch` pourra aussi être retiré du fichier s'il n'est plus utilisé ailleurs dans ce composant. Les props `onToggleCoutLocatif` restent dans l'interface car elles sont utilisées par le composant parent pour le toggle principal.
