## Mettre en avant le montant périodique + le reporter dans le template

### 1. Onglet Données (`ServiceProposalDataStep.tsx`)
Remplacer le petit texte muted par un encart bien visible aligné à droite :
- Fond `bg-primary/10`, bordure `border-primary/30`, coin arrondi, padding ~ `px-3 py-2`
- Libellé "Soit" petit + montant en `text-base font-bold text-primary` + suffixe `/mois HT` ou `/trimestre HT`
- Affiché uniquement si `payment_frequency` et `totalServices > 0`
- Le "Total services : X € HT" reste au-dessus, inchangé

### 2. Template — Preview + Export PDF
Ajouter une ligne supplémentaire dans le tableau "Vos modalités de règlement" (zone `service_conditions`), après "Total HT services" :
- Libellé : `Loyer mensuel HT` (si mensuel) ou `Loyer trimestriel HT` (si trimestriel)
- Valeur : `totalServicesHt / 12` ou `totalServicesHt / 4`, arrondi `Math.round(x*100)/100`, formaté via `formatNumber`, suivi de ` €`
- Marqué `bold = true` (mise en évidence comme le total)
- Non affichée si `payment_frequency` est vide

Fichiers touchés :
- `src/components/service-proposal/ServiceProposalPreview.tsx` (tableau JSX ligne ~440)
- `src/components/service-proposal/ServiceProposalExport.tsx` (tableau HTML ligne ~366)
- `src/components/service-proposal/ServiceProposalDataStep.tsx` (encart visuel)

Aucun changement de données persistées : la valeur est purement dérivée de `totalServicesHt` et `payment_frequency` déjà stockés.
