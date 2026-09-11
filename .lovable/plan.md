# Corriger l’import des devis Cybertek dans Proposition Location

## Résultat attendu

Le devis joint sera reconnu comme un devis Cybertek et remplira automatiquement l’onglet Invest avec ses quatre lignes facturées hors transport :

- PC Fixe PC ACREOS – NOVA – TOUR/INTEL : 3 × 1 212,98 € = 3 638,94 €
- Clavier PC Perixx PERIBOARD-510 H PLUS : 3 × 44,00 € = 132,00 €
- Services ACREOS – Sérialisation : 1 × 100,00 €
- Services Stickers ACREOS DEMARRAGE : 1 × 185,43 €

Le total HT repris restera celui du document : 4 056,37 €.

## Modifications

1. **Fiabiliser la reconnaissance du fournisseur**
   - Donner priorité au contenu explicite du PDF (`CYBERTEK PRO`, `GROUPE CYBERTEK`, etc.) plutôt qu’au nom générique `Devis_...`.
   - Conserver la reconnaissance par nom de fichier comme solution de repli lorsque le contenu n’identifie pas le fournisseur.

2. **Accepter ce format Cybertek**
   - Étendre la lecture des lignes Cybertek aux codes numériques et aux montants terminés par `EUR`, en plus du symbole `€`.
   - Récupérer séparément la référence, la désignation, le prix unitaire, la quantité et le total HT.
   - Continuer à exclure la ligne Transport de l’investissement, sans supprimer les lignes de services facturées.

3. **Sécuriser les totaux**
   - Lire les montants HT, TVA et TTC du bloc de totaux quand les valeurs sont affichées sur la ligne suivante et utilisent `EUR`.
   - Ne pas recalculer ces totaux lorsque ceux du devis sont disponibles.

4. **Vérifier le parcours complet**
   - Recharger le PDF joint dans Proposition Location.
   - Contrôler les quatre lignes, leurs quantités, prix unitaires et totaux, ainsi que le total HT de 4 056,37 € dans Invest.
   - Vérifier qu’un devis Grosbill conserve sa propre lecture et que les anciens formats Cybertek avec `€` restent compatibles.

## Détails techniques

La correction sera limitée au lecteur PDF Location. Le devis joint est actuellement classé `grosbill` par son nom `Devis_6612214_...`, alors que son contenu indique Cybertek. De plus, ses lignes utilisent `EUR`, tandis que les expressions actuelles attendent principalement `€`.
