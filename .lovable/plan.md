## Problème

Dans Proposition Services, l'aperçu affiche uniquement un bloc client minimal (raison sociale, adresse, SIRET, « Représentée par ») — sans email, téléphone, ni bloc « Votre interlocuteur ». Dans Proposition Location, l'aperçu affiche correctement le bloc complet client + interlocuteur identique à ce que produit l'export PDF.

## Cause

`src/components/service-proposal/ServiceProposalPreview.tsx` contient deux logiques concurrentes pour la page 1 :

1. `renderPage1ClientBlock()` (lignes 413-448) — bloc complet client + interlocuteur, identique à Location.
2. La zone dynamique `service_client_info` (lignes 298-310) — bloc minimal (raison sociale, adresse, SIRET, « Représentée par »).

Ligne 470 :
```
templatePageNumber === 1 && pageDynamicZones.every(z => z.type !== 'service_client_info') && renderPage1ClientBlock()
```
Comme le template « Contrat Cadre Services » contient une zone `service_client_info`, le bloc complet est supprimé et seul le bloc minimal s'affiche. L'export PDF, lui, génère toujours le bloc complet → désynchronisation aperçu / export.

## Correction

Aligner le rendu de la zone dynamique `service_client_info` sur celui de `renderPage1ClientBlock` (et donc sur celui de l'export et de Location). Un seul fichier modifié :

**`src/components/service-proposal/ServiceProposalPreview.tsx`**

- Dans `renderServiceDynamicZone`, remplacer le rendu du bloc `service_client_info` par exactement la même structure que `renderPage1ClientBlock` :
  - colonne gauche : raison sociale, nom, adresse, email, téléphone
  - colonne droite : « Votre interlocuteur » avec nom / téléphone / email du commercial sélectionné (via `getCommercialById(commercialData.commercialId)`)
  - sous le bloc, ligne adresse de l'entité commerciale en bas de page
- Conserver le positionnement piloté par la zone (`top` issu de `zone.position?.top`, ou valeur par défaut actuelle) afin de respecter la position définie dans le template.
- Le fallback ligne 470 (`pageDynamicZones.every(z => z.type !== 'service_client_info')`) reste inchangé : si aucune zone n'est définie dans le template, `renderPage1ClientBlock` continue de s'afficher.

Aucune autre modification (export, store, template) — la logique d'export produit déjà le bloc complet ; seul l'aperçu était incohérent.

## Résultat attendu

L'aperçu Proposition Services affichera, sur la page 1, le même bloc complet que Proposition Location et que le PDF exporté : informations client (raison sociale, nom, adresse, email, téléphone) à gauche et « Votre interlocuteur » avec les coordonnées du commercial à droite.
