

# Plan : Date dynamique sur la Page 1 (format "Mois Année")

## Objectif

Remplacer automatiquement le texte statique "Janvier 2026" (ou tout mois/année saisi manuellement dans le template) par le **mois en cours** au moment de l'affichage/export, au format **"Mois année"** (ex: "Janvier 2026").

## Approche technique

La date affichée sur la Page 1 est un **élément texte du template** (pas du code). Pour rendre cette date dynamique sans modifier le template, on utilisera un système de **placeholder avec substitution automatique**.

### Mécanisme de substitution

1. Créer une fonction utilitaire `substituteDynamicPlaceholders(text: string): string`
2. Cette fonction détecte des patterns spécifiques et les remplace par les valeurs dynamiques
3. Pattern pour la date : `{{DATE}}` ou détection automatique des mois français suivis d'une année

### Patterns supportés

| Pattern | Résultat exemple | Description |
|---------|-----------------|-------------|
| `{{DATE}}` | "Janvier 2026" | Mois en cours + année |
| Auto-détection "Mois 20XX" | Mois actuel + année actuelle | Remplace automatiquement les dates statiques au format français |

## Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `src/lib/template-render-utils.ts` | Ajouter la fonction `substituteDynamicPlaceholders()` et `getCurrentDateFR()` |
| `src/components/rental-proposal/RentalProposalPreview.tsx` | Appliquer la substitution dans `renderTextContent()` |
| `src/lib/pdf-html-generator.ts` | Appliquer la substitution dans `renderTextElementToHTML()` |

## Détail de l'implémentation

### 1. Nouvelle fonction dans template-render-utils.ts

```typescript
/**
 * Noms des mois en français pour la substitution de date
 */
const MOIS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Retourne la date actuelle au format "Mois année" en français
 */
export const getCurrentDateFR = (): string => {
  const now = new Date();
  return `${MOIS_FR[now.getMonth()]} ${now.getFullYear()}`;
};

/**
 * Substitue les placeholders dynamiques dans un texte
 * - {{DATE}} : remplacé par le mois et l'année en cours
 * - Auto-détection des dates "Mois 20XX" : remplacées par le mois en cours
 */
export const substituteDynamicPlaceholders = (text: string): string => {
  if (!text) return text;
  
  const currentDate = getCurrentDateFR();
  
  // Remplacer le placeholder explicite {{DATE}}
  let result = text.replace(/\{\{DATE\}\}/gi, currentDate);
  
  // Auto-détection : remplacer "Mois 20XX" par la date actuelle
  // Pattern : un mois français suivi d'un espace et d'une année 20XX
  const moisPattern = MOIS_FR.join('|');
  const dateRegex = new RegExp(`(${moisPattern})\\s+20\\d{2}`, 'gi');
  result = result.replace(dateRegex, currentDate);
  
  return result;
};
```

### 2. Modification dans RentalProposalPreview.tsx

Dans la fonction `renderTextContent()` (lignes 243-273), appliquer la substitution sur le texte avant affichage :

```typescript
import { substituteDynamicPlaceholders } from '@/lib/template-render-utils';

const renderTextContent = (textContent: TextContent) => {
  // ... code existant ...
  
  // Si contenu HTML enrichi, appliquer la substitution
  if (textContent.htmlContent) {
    const processedHtml = substituteDynamicPlaceholders(textContent.htmlContent);
    return (
      <div 
        style={{ paddingLeft: `${indentPx}px` }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    );
  }
  
  // Fallback sur le texte brut avec substitution
  const text = substituteDynamicPlaceholders(textContent.text || '');
  // ... reste du code ...
};
```

### 3. Modification dans pdf-html-generator.ts

Dans la fonction `renderTextElementToHTML()` (lignes 116-172), appliquer la même substitution :

```typescript
import { substituteDynamicPlaceholders } from './template-render-utils';

function renderTextElementToHTML(element: EditableElement): string {
  const content = element.content as TextContent;
  // ... code existant ...
  
  // Contenu : htmlContent ou génération manuelle des lignes
  let textContent: string;
  if (content.htmlContent) {
    // Appliquer la substitution dynamique
    const processedHtml = substituteDynamicPlaceholders(content.htmlContent);
    const contentStyle = indentPx > 0 ? `padding-left: ${indentPx}px;` : '';
    textContent = contentStyle ? `<div style="${contentStyle}">${processedHtml}</div>` : processedHtml;
  } else {
    // Appliquer la substitution sur le texte brut
    const text = substituteDynamicPlaceholders(content.text || '');
    // ... reste du code ...
  }
  
  return `<div style="${styleToString(outerStyle)}"><div style="${styleToString(innerStyle)}">${textContent}</div></div>`;
}
```

## Comportement attendu

### Dans le Template Editor
- Le texte "Janvier 2026" reste **modifiable** normalement
- Pas de changement de comportement pour l'éditeur

### Dans l'Aperçu (Preview) et l'Export PDF
- Tout texte correspondant au pattern "Mois 20XX" est **automatiquement remplacé** par le mois en cours
- Exemple : "Janvier 2026" → "Janvier 2026" (si on est en janvier 2026)
- Exemple : "Septembre 2025" → "Janvier 2026" (si on est en janvier 2026)

## Avantages de cette approche

1. **Aucune modification du template nécessaire** : le texte existant "Janvier 2026" sera automatiquement remplacé
2. **Rétrocompatibilité** : fonctionne avec les templates existants
3. **Flexibilité** : possibilité d'utiliser `{{DATE}}` pour un contrôle explicite
4. **Cohérence WYSIWYG** : même substitution dans Preview et Export

## Points de vigilance

- La substitution s'applique à **tous** les textes correspondant au pattern "Mois 20XX"
- Si l'utilisateur veut afficher une date spécifique figée, il devra utiliser un format différent (ex: "01/2026")

