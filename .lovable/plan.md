## Objectif
Supprimer la page 4 du template "Contrat Cadre Services" qui duplique le tableau des services déjà présent en page 3.

## Modifications

1. **`src/lib/seedContratCadreTemplate.ts`**
   - Retirer la définition de la page 4 (celle contenant la zone dynamique `service_invest_table` en doublon).
   - Renuméroter les pages suivantes (5→4, 6→5) pour conserver une séquence continue.
   - Mettre à jour le total des pages du template si stocké dans les métadonnées.

2. **Bouton "Initialiser Contrat Cadre Services"** (déjà présent dans `TemplateEditorLayout.tsx`)
   - Aucune modification nécessaire ; l'utilisateur devra cliquer dessus (avec force overwrite) pour régénérer le template à 5 pages.

## Note
La modification ne concerne que le seeder du template. Le rendu (`ServiceProposalPreview.tsx` / `ServiceProposalExport.tsx`) reste inchangé car il itère dynamiquement sur les pages du template : supprimer la page 4 dans le seed suffit à faire disparaître le tableau dupliqué du PDF généré.

Après implémentation, il faudra cliquer sur "Initialiser Contrat Cadre Services" pour appliquer le nouveau template.
