

## Ajout d'un logo client dans la section "Informations client"

### Objectif

Permettre a l'utilisateur d'uploader une image (JPEG, PNG, SVG) comme logo du client. Ce logo s'affichera sur la page 1 (couverture) du template, a droite du logo existant de l'entite (en dessous de la date), aligne horizontalement.

### Modifications

**Fichier : `src/stores/rentalProposalStore.ts`**

- Ajouter un champ `logoUrl: string` dans l'interface `ClientData` (valeur initiale : `''`)
- Ajouter la validation de ce champ dans le `merge` de rehydratation (comme les autres champs string de `clientData`)
- Le champ est mis a jour via `updateClientField('logoUrl', dataUrl)` comme les autres champs texte

**Fichier : `src/components/rental-proposal/RentalDataEditor.tsx`**

- Dans la carte "Informations client", ajouter un bloc **apres le champ Telephone** :
  - Label "Logo client"
  - Un `<input type="file" accept="image/*">` masque, declenche par un bouton ou une zone de drop
  - A la selection du fichier, convertir en Data URL via `FileReader.readAsDataURL()` et appeler `updateClientField('logoUrl', dataUrl)`
  - Si un logo est deja charge : afficher une miniature (64x64) avec un bouton de suppression (croix) qui remet `logoUrl` a `''`

**Fichier : `src/components/rental-proposal/RentalProposalPreview.tsx`**

- Dans `renderPage1` > `renderClientData()` :
  - Ajouter au-dessus du bloc client (ou a droite du logo entite template), une `<img>` affichant `clientData.logoUrl` si non vide
  - Positionnement : a droite du logo entite existant, en dessous de la date, aligne horizontalement
  - Taille : hauteur contrainte (~30px dans le preview) avec `object-contain` pour respecter les proportions

**Fichier : `src/components/rental-proposal/RentalProposalExport.tsx`**

- Dans `generateDynamicContentByPage()`, page 1 :
  - Ajouter un `<img>` HTML inline avec le `clientData.logoUrl` (Data URL) si non vide
  - Position : a droite du logo entite, meme alignement vertical, hauteur ~40px

### Compatibilite avec l'existant

- Le champ `logoUrl` est optionnel (`string` vide par defaut), les donnees existantes ne sont pas impactees
- La rehydratation Zustand traite les champs manquants comme `''`
- Aucun upload distant ou stockage cloud n'est necessaire : le logo est stocke en Data URL dans le localStorage via le store persiste

### Resume technique

| Fichier | Modification |
|---|---|
| `src/stores/rentalProposalStore.ts` | Ajout `logoUrl` dans `ClientData`, validation rehydratation |
| `src/components/rental-proposal/RentalDataEditor.tsx` | Zone d'upload logo client avec apercu et suppression |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Affichage du logo client a droite du logo entite sur la page 1 |
| `src/components/rental-proposal/RentalProposalExport.tsx` | Injection HTML du logo client dans la page 1 du PDF |

