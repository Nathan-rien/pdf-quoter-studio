
## Ajout des titres "Vos investissements" et "Votre offre" sur la Page 4

### Modifications

**Fichier** : `src/components/rental-proposal/RentalProposalPreview.tsx`

Fonction `renderProductTableWithFlowElements` (ligne 722+) :

1. **Ajouter "Vos investissements"** (avant le tableau produits, ligne 731)
   - Inserer un titre `<div>` avec le texte "Vos investissements" style en `font-semibold text-[11px] mb-1` juste avant le `<div className="border rounded overflow-hidden">` du tableau

2. **Ajouter "Votre offre"** (avant le bloc Location, ligne 765)
   - Inserer un titre `<div>` avec le texte "Votre offre" style en `font-semibold text-[11px] mb-1` juste avant le mapping des propositions financieres (bloc "Location X mois")

### Resultat attendu
- "Vos investissements" apparait comme titre au-dessus du tableau Designation/Qte/P.U. HT/Total HT
- "Votre offre" apparait comme titre au-dessus du bloc "Location 36 mois"
