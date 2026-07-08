## Problème

Sur les contrats rapides, l'ajout du badge « CONTRAT RAPIDE » a fait exploser la grille d'actions (`grid-cols-[1fr_auto_auto_auto]` = 4 colonnes) : œil + téléchargement + badge + poubelle + chevron = 6 items → la corbeille et le chevron passent à la ligne, désalignés des contrats normaux.

## Objectif

Aligner strictement les actions (Visualiser, Télécharger, Supprimer, Chevron) sur une seule ligne à droite, identiques entre contrats rapides et contrats normaux.

## Changement

Fichier : `src/components/contracts/ContractRow.tsx` (ligne repliée uniquement).

1. **Déplacer le badge « CONTRAT RAPIDE » hors de la zone d'actions** : le placer à côté du nom du client / numéro de contrat, au même emplacement que le badge « N° 264746FS0 ». Il ne consommera plus de colonne dans la grille.
2. **Structure d'actions unifiée** pour tous les contrats : `[Eye] [Download] [Trash] [Chevron]` — même ordre, même espacement, même colonne d'ancrage à droite.
3. Conserver la logique conditionnelle interne des boutons (grisés/désactivés pour les rapides sans PDF joint), inchangée par rapport à l'itération précédente.
4. Le libellé sous la ligne (« Contrat rapide » ou nom du template) reste inchangé.

## Hors périmètre

- Aucune modification du panneau déplié, de la logique de sauvegarde, ni du tri.
- Aucun changement sur le parcours Services.
