

## Corriger la difference d'affichage du "Total investissement" entre Preview et PDF

### Probleme

Le bloc "Total investissement" utilise deux styles differents :

- **Preview** : `bg-primary/5` (fond tres leger), `p-2` (8px padding), pas de bordure
- **Export PDF** : classe `.summary-box` definie dans `pdf-html-generator.ts` avec `background: #eff6ff` (bleu visible), `padding: 12px`, `border: 1px solid #bfdbfe` (bordure bleue)

Le style CSS du PDF est trop prononce et ne correspond pas au rendu de l'apercu.

### Solution

Aligner le style `.summary-box` dans `pdf-html-generator.ts` sur le style du Preview : fond quasi transparent, padding reduit, pas de bordure bleue.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/lib/pdf-html-generator.ts` (lignes 667-672) | Remplacer le style `.summary-box` pour correspondre au Preview : fond tres leger (`rgba(59,130,246,0.05)` = equivalent de `bg-primary/5`), padding `8px`, pas de bordure |

### Code cible

```css
.summary-box {
  background: rgba(59, 130, 246, 0.05);
  padding: 8px;
  border-radius: 8px;
}
```

Suppression de `border: 1px solid #bfdbfe` et reduction du padding de 12px a 8px pour correspondre au `p-2` du Preview.

