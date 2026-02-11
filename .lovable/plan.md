

## Ajouter de l'espace entre les blocs "Avantages" et "Condition de l'offre"

### Modification

**Fichier** : `src/components/rental-proposal/RentalProposalPreview.tsx`

**Dans la fonction `renderFlowElement`** (ligne ~684) :
- Ajouter une logique conditionnelle : si l'element est en gras (titre de section comme "Avantages :" ou "Condition de l'offre :") ET qu'il n'est pas le premier element en flux, appliquer un `mt-3` au lieu de rien, pour creer un espace visuel entre les blocs
- Passer l'index `idx` en parametre pour detecter le premier element
- Changer la classe de `mb-0.5` a `mb-0.5` (inchange) et ajouter conditionnellement `mt-3` quand `content.bold === true && idx > 0`

### Detail technique

```tsx
// Ligne 684 environ, dans renderFlowElement :
const isSectionTitle = content.bold && idx > 0;

<div
  key={element.id}
  className={cn("mb-0.5", isSectionTitle && "mt-3")}
  ...
>
```

### Resultat attendu
- Un espace net apparait entre la derniere bullet point d'"Avantages" et le titre "Condition de l'offre :"
- Le premier titre ("Avantages :") reste colle au bloc Location au-dessus (separe uniquement par le `mt-4` existant)
