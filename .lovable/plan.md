

## Injection automatique des frais de dossier dans les templates existants

### Probleme

Le placeholder `{{FRAIS_DOSSIER}}` a ete ajoute aux **elements par defaut** du template, mais les templates deja sauvegardes/publies conservent leur ancien texte (ex: "Frais de dossier bancaire" sans placeholder ni montant). La substitution ne se declenche donc jamais.

### Solution

Ajouter une auto-detection dans `substituteDynamicPlaceholders` (comme c'est deja fait pour les dates "Mois 20XX") : si le texte contient "Frais de dossier bancaire" sans etre suivi d'un montant ou du placeholder, inserer automatiquement le montant formate.

### Modifications

**Fichier unique** : `src/lib/template-render-utils.ts`

Dans la fonction `substituteDynamicPlaceholders`, apres le remplacement du placeholder `{{FRAIS_DOSSIER}}`, ajouter une detection supplementaire :

- Pattern regex : `Frais de dossier bancaire` non suivi d'un montant (ni chiffres, ni `{{FRAIS_DOSSIER}}`)
- Remplacement : ajouter ` [montant formate] € HT` apres "Frais de dossier bancaire"
- Cela couvre aussi le cas ou le texte contient deja un ancien montant en dur (ex: "60,00 EUR HT") : le regex detectera et remplacera

Concretement, le regex ciblera :
```text
/Frais de dossier bancaire(?:\s+[\d,.\s]+(?:€|EUR)\s*HT\.?)?/gi
```
Et le remplacera par :
```text
Frais de dossier bancaire [montant] € HT
```

Cela garantit que les templates anciens comme les nouveaux affichent toujours le bon montant, sans avoir besoin de re-publier le template.

### Impact
- Aucune modification des templates sauvegardes necessaire
- Compatible avec les templates qui ont deja le placeholder `{{FRAIS_DOSSIER}}`
- Le meme fichier `pdf-html-generator.ts` beneficiera automatiquement de la correction pour l'export PDF

