

## 1. Deplacer "Frais de dossier" a gauche de la carte "Condition fin de contrat"

### Modification

Inverser l'ordre des deux colonnes dans la carte "Condition fin de contrat" de l'onglet Matrice :
- **Colonne gauche** : Label "Frais de dossier" + montant (actuellement a droite)
- **Colonne droite** : Badge condition fin de contrat (actuellement a gauche)

### Fichier

`src/components/rental-proposal/RentalDataEditor.tsx` (lignes 439-457) : inverser les deux `<div>` enfants du `grid grid-cols-2`.

---

## 2. Ajouter un champ "Commentaire" avec injection dans l'Apercu et le PDF

### Principe

Un champ texte libre "Commentaire" est ajoute dans la carte "Condition fin de contrat". Son contenu est affiche automatiquement dans l'Apercu et le PDF, sous les sections "Avantages" et "Conditions de l'offre" (elements en flux relatif de la page 4).

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `src/stores/rentalProposalStore.ts` | Ajouter `commentaire: string` dans `MatriceData`, initialise a `''`. Pas de nouvelle action necessaire car `updateMatriceField` couvre deja ce champ. |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Ajouter un champ `Textarea` "Commentaire" sous la carte "Condition fin de contrat" (ou dans la meme carte, sous les deux colonnes). Lie a `matriceData.commentaire` via `updateMatriceField('commentaire', value)`. |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Apres le rendu des `elementsBelow` (ligne ~985), ajouter un bloc conditionnel qui affiche `matriceData.commentaire` si non vide, avec un style coherent (meme taille de police que les elements de flux). |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Apres `flowElementsHTML` (ligne ~460), ajouter le HTML du commentaire si non vide, avec le meme style que les elements de flux. |

### Detail technique

**Store** : Ajouter dans `MatriceData` :
```text
commentaire: string;  // Commentaire libre affiché sous Avantages/Conditions
```

Valeur initiale : `''`

**Preview** (apres ligne ~986) :
```text
{matriceData.commentaire && (
  <div className="mt-2" style={{ fontSize: scaledFontSize, ... }}>
    {matriceData.commentaire}
  </div>
)}
```

**Export** (apres `flowElementsHTML`) :
```text
if (commentaire) {
  flowElementsHTML += `<div style="margin-top: 8px; font-size: 10px;">
    ${commentaire}
  </div>`;
}
```

### Ce qui ne change pas
- Les elements de template existants (Avantages, Conditions)
- La logique de substitution des placeholders
- Le drag-and-drop des blocs dynamiques
