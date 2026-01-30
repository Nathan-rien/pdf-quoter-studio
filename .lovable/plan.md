
# Plan : Permettre la désactivation du format Liste

## Problème identifié

Dans le panneau des propriétés de l'éditeur de template, les boutons de type de liste (Aucune, Puces, Numérotée) fonctionnent comme un groupe de boutons radio. Le problème est que lorsqu'on clique sur un bouton déjà actif (par exemple "Puces" quand le texte est déjà en mode liste à puces), rien ne se passe au lieu de désactiver le mode liste.

Actuellement le code fait :
```jsx
onPressedChange={() => handleListTypeChange('bullet')}
```

Le handler ignore l'état "pressed" et définit toujours le même type, empêchant la désactivation.

## Solution

Modifier les handlers `onPressedChange` pour qu'ils reçoivent le paramètre `pressed` et agissent en conséquence :
- Si `pressed === true` : activer le type de liste demandé
- Si `pressed === false` : désactiver la liste (revenir à `'none'`)

## Fichier à modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/template-editor/ElementProperties.tsx` | Modifier les 3 handlers de Toggle pour les types de liste (lignes 557, 566, 575) |

## Détail des modifications

### Modifier les handlers onPressedChange (lignes 553-580)

```jsx
// AVANT
<Toggle
  size="sm"
  pressed={textContent.listType === 'none' || !textContent.listType}
  onPressedChange={() => handleListTypeChange('none')}
  ...
>
<Toggle
  size="sm"
  pressed={textContent.listType === 'bullet'}
  onPressedChange={() => handleListTypeChange('bullet')}
  ...
>
<Toggle
  size="sm"
  pressed={textContent.listType === 'numbered'}
  onPressedChange={() => handleListTypeChange('numbered')}
  ...
>

// APRÈS
<Toggle
  size="sm"
  pressed={textContent.listType === 'none' || !textContent.listType}
  onPressedChange={(pressed) => pressed && handleListTypeChange('none')}
  ...
>
<Toggle
  size="sm"
  pressed={textContent.listType === 'bullet'}
  onPressedChange={(pressed) => handleListTypeChange(pressed ? 'bullet' : 'none')}
  ...
>
<Toggle
  size="sm"
  pressed={textContent.listType === 'numbered'}
  onPressedChange={(pressed) => handleListTypeChange(pressed ? 'numbered' : 'none')}
  ...
>
```

## Comportement attendu

| Action | Résultat |
|--------|----------|
| Clic sur "Puces" (inactif) | Active le mode liste à puces |
| Clic sur "Puces" (actif) | Désactive la liste (revient à "Aucune") |
| Clic sur "Numérotée" (inactif) | Active le mode liste numérotée |
| Clic sur "Numérotée" (actif) | Désactive la liste (revient à "Aucune") |
| Clic sur "Aucune" (inactif) | Active le mode sans liste |
| Clic sur "Aucune" (déjà actif) | Pas de changement (comportement normal) |

## Points techniques

- Le premier Toggle ("Aucune"/Minus) utilise `pressed && handleListTypeChange('none')` car on ne veut pas le désactiver (il n'y a pas de "moins que aucune liste")
- Les deux autres Toggles utilisent `pressed ? 'type' : 'none'` pour permettre la désactivation vers le mode "none"
- Cette modification suit le pattern standard des toggle groups où un clic sur un toggle actif le désactive
