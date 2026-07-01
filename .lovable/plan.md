
## Objectif

Optimiser la mise en forme visuelle des données injectées dans les 3 zones dynamiques du contrat Services, style **tableau bordé compact** contractuel, **sans toucher au template** en base (pas de re-seed, pas de nouvelle version, `seedContratCadreTemplate.ts` intact).

## Portée

Modifier uniquement 2 fichiers de rendu :

- `src/components/service-proposal/ServiceProposalPreview.tsx` (aperçu écran)
- `src/components/service-proposal/ServiceProposalExport.tsx` (HTML PDF)

Aucune migration, aucune modif du store, aucune modif du seeder ni des versions publiées.

## Détails visuels — style "tableau bordé compact"

### 1. `service_invest_table` (tableau produits)

- En-tête : fond gris `#f3f4f6`, texte `#374151`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.03em`, `font-size: 8px`.
- Corps : bordures fines `1px solid #e5e7eb` sur toutes cellules, `border-collapse: collapse`.
- Zébrures alternées : lignes paires `background: #fafafa`.
- Colonnes recalibrées : Désignation ~60%, Qté centrée 40px, P.U. HT droite 70px, Total HT droite 80px.
- Padding cellule `5px 8px`, `vertical-align: top`.
- Total HT hors tableau : encart bordé compact `border: 1px solid #d1d5db`, fond blanc, `padding: 6px 10px`, label gras à gauche / valeur alignée droite, plus de fond bleu — cohérent avec le style contractuel.

### 2. `service_conditions` (bloc conditions)

Remplacer la liste `<br />` par un mini-tableau bordé 2 colonnes label / valeur :

```text
┌─────────────────────┬───────────────────────────────┐
│ Services            │ Pro-maintenance, Pro-logiciel │
│ Périodicité         │ Trimestrielle                 │
│ Mode de règlement   │ Prélèvement automatique       │
│ Durée               │ 60 mois                       │
│ Démarrage           │ 01/08/2026                    │
│ Total HT services   │ 6 000,00 €                    │
└─────────────────────┴───────────────────────────────┘
```

- Bordures fines `1px solid #e5e7eb`, `border-collapse: collapse`, `font-size: 9px`.
- Colonne label : `width: 38%`, fond `#f9fafb`, `font-weight: 600`, `color: #374151`, padding `4px 8px`.
- Colonne valeur : `color: #1f2937`, padding `4px 8px`.
- Dernière ligne "Total HT services" : `font-weight: 700`, valeur alignée droite.

### 3. `service_client_info` (infos client)

- Passer d'une grille libre à un encadré bordé compact deux colonnes, séparateur vertical.
- Structure : bordure `1px solid #e5e7eb`, `border-radius: 6px`, padding `6px 10px`, fond blanc.
- Colonne gauche (Bénéficiaire) : petit label `BÉNÉFICIAIRE` en `uppercase`, `font-size: 7px`, `color: #6b7280`, `letter-spacing: 0.05em`, puis raison sociale en gras 9px, nom, adresse, email, téléphone en 8px `#4b5563`.
- Colonne droite (Interlocuteur) : label `VOTRE INTERLOCUTEUR` idem, nom commercial en gras 9px, téléphone / email / entité en 8px.
- Séparateur : `border-left: 1px solid #e5e7eb` sur la colonne droite avec `padding-left: 12px`.
- Interligne resserré (`line-height: 1.3`), aucune modification des positions `top` / `height` (héritées du template inchangé).

## Cohérence Aperçu ↔ PDF

Les mêmes structures HTML/CSS sont dupliquées dans `ServiceProposalPreview.tsx` (React/JSX + Tailwind) et `ServiceProposalExport.tsx` (chaînes HTML inline-styled) pour parité WYSIWYG stricte, en gardant `getServiceZoneStyle` avec fallbacks existants (`top`/`height` du template respectés en priorité).

## Hors périmètre

- `service_signature` (non demandé)
- `seedContratCadreTemplate.ts`
- Toute modification de version publiée / brouillon en base
- Store, types, hooks
