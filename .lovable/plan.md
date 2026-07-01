## Objectif

Aligner l'affichage du bloc « Les services inclus dans votre offre » dans **Propositions Services** sur celui de **Proposition Location** : titre avec icône fichier + carte bordée « Services location » (en-tête gris + liste à puces).

## Modifications

### 1. `src/components/service-proposal/ServiceProposalPreview.tsx` — `renderServicesInclusPage`
Remplacer le rendu texte brut actuel par :
- Titre avec icône `FileCheck` + « Les services inclus dans votre offre »
- Carte bordée `border rounded` contenant :
  - En-tête `bg-muted` avec pastille verticale + libellé « Services location »
  - Corps avec la description en puces (`•`) + support sous-items `- ` indentés (identique à `renderServiceBloc` du Location, lignes 1114–1136).

### 2. `src/components/service-proposal/ServiceProposalExport.tsx` — bloc `servicesInclusPageHTML`
Remplacer le paragraphe `white-space: pre-wrap` par le même markup HTML que `servicesLocationHTML` du RentalProposalExport (lignes 635–645) :
- Conteneur bordé
- En-tête gris avec pastille + « Services location »
- Corps blanc, chaque ligne rendue en `<div>• …</div>` (indentation pour `- `)

Le titre de page « Les services inclus dans votre offre » (avec icône SVG) est conservé au-dessus, comme aujourd'hui.

### Hors périmètre
- Aucun changement au store, aux types, ni au template.
- Aucun impact sur la Proposition Location.
- Le contenu par défaut de `servicesInclus.description` reste inchangé.
