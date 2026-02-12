

## Retirer les bullet points devant les sous-elements (- Niveau 1, - Niveau 2...)

### Probleme
Les sous-elements des options de service (ex: "- Niveau 1 : ...", "- Niveau 2 : ...") commencent deja par un tiret dans le texte. En les affichant dans une liste `list-disc`, un bullet point est ajoute devant le tiret, ce qui est redondant.

### Solution
Dans `RentalProposalPreview.tsx`, modifier le rendu des descriptions pour detecter les lignes commencant par `- ` et les afficher sans bullet point, avec une indentation. Les lignes normales (commencant par un texte sans tiret) garderont le bullet point classique.

### Fichier modifie : `src/components/rental-proposal/RentalProposalPreview.tsx`

Remplacer le rendu actuel (6 occurrences, lignes ~847, ~871, ~905, ~955, ~997, ~1022) :

```tsx
// Avant
<ul className="... list-disc list-inside">
  {description.split('\n').map((item, i) => (
    <li key={i} className="leading-tight">{item.trim()}</li>
  ))}
</ul>

// Apres
<div className="... space-y-0.5">
  {description.split('\n').map((item, i) => {
    const trimmed = item.trim();
    if (!trimmed) return null;
    const isSubItem = trimmed.startsWith('- ');
    return (
      <div key={i} className={`leading-tight ${isSubItem ? 'pl-3' : ''}`}>
        {isSubItem ? trimmed : `• ${trimmed}`}
      </div>
    );
  })}
</div>
```

Cela affichera :
- Les lignes principales avec un bullet point `•`
- Les sous-elements (commencant par `- `) avec une simple indentation, sans bullet supplementaire

