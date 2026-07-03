## Ajout du calcul périodique du total services

Dans `src/components/service-proposal/ServiceProposalDataStep.tsx`, ajouter sous la ligne "Total services : X € HT" un second affichage qui montre le montant réparti selon la périodicité sélectionnée.

### Comportement
- Si `payment_frequency === 'mensuel'` → afficher `Total services / 12` avec libellé "Soit X €/mois HT"
- Si `payment_frequency === 'trimestriel'` → afficher `Total services / 4` avec libellé "Soit X €/trimestre HT"
- Si aucune périodicité sélectionnée → ne rien afficher (ou message discret "Sélectionnez une périodicité")

### Détails techniques
- Calcul : `Math.round((totalServices / diviseur) * 100) / 100` (respecte la règle de précision financière du projet)
- Formatage : `toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
- Emplacement : juste sous le "Total services" existant, même alignement à droite, style légèrement plus discret (text-muted-foreground)
- Aucun impact sur la persistance ni les autres vues — c'est purement un affichage dérivé

### Fichier modifié
- `src/components/service-proposal/ServiceProposalDataStep.tsx`
