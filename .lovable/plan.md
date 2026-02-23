

## Corriger le decalage du logo client entre mode Modifier et Lecture

### Probleme identifie

Le composant `ClientLogoDraggable` applique un `transform: translateX(-50%)` **uniquement en mode lecture** (pour centrer le logo sur le point `leftPct`). En mode edition, cette transformation n'est pas appliquee : le bord gauche du logo est place directement a `leftPct`.

Quand l'utilisateur deplace le logo en mode edition, la position sauvegardee correspond au bord gauche. En repassant en mode lecture, le `translateX(-50%)` decale le logo vers la gauche de la moitie de sa largeur, creant le decalage visible sur les captures.

### Solution

Appliquer le meme `translateX(-50%)` en mode edition dans `ClientLogoDraggable`, pour que le comportement soit identique dans les deux modes. Cela garantit que la position stockee (`leftPct`) represente toujours le centre du logo.

### Fichier modifie

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/ClientLogoDraggable.tsx` | Ajouter `transform: translateX(-50%)` dans le style du conteneur en mode edition (quand `useTranslateX` est vrai), pour que le rendu soit identique au mode lecture |

### Detail technique

Dans `ClientLogoDraggable.tsx`, le mode edition (ligne ~140) a ce style :

```text
style={{
  top: `${topPct}%`,
  left: `${leftPct}%`,
  width: width ? `${width}px` : 'auto',
  ...heightStyle,
}}
```

Il manque le `transform: translateX(-50%)` que le mode lecture applique (ligne ~125). L'ajout de cette transformation dans le mode edition corrigera le decalage.

### Ce qui ne change pas
- La logique de positionnement automatique (`autoTopPct` / `autoLeftPct`)
- Le fonctionnement du drag-and-drop (les deltas en pourcentage restent corrects)
- Le mode lecture
- L'export PDF

