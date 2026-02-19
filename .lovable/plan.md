
## Correction : prix manquants pour "Nos Options" sur Page 5 (aperçu + PDF)

### Cause identifiée

Il existe **deux endroits** différents où "Nos Options" est rendu :

1. **Page 5 (fusionné)** — Les options "Nos Options" apparaissent dans le bas du bloc "Les services inclus dans votre offre" de la Page 5. C'est ce que l'utilisateur voit sur la capture d'écran. **Ce bloc n'a pas reçu la correction du prix.**

2. **Page 6 (dédiée)** — La fonction `renderNosOptionsPage()` qui gère la page entière "Nos Options". Celle-ci a bien reçu la correction, mais elle ne correspond pas à ce qui est visible dans l'aperçu actuel.

La correction précédente n'a ciblé que le bloc Page 6, alors que l'affichage actuel provient du bloc Page 5 (fusionné).

### Fichiers à modifier

#### 1. `src/components/rental-proposal/RentalProposalPreview.tsx` — Bloc fusionné Page 5 (lignes 978-982)

Le header de chaque carte "Nos Options" dans le bloc Page 5 :

**Avant (lignes 978-982)** :
```tsx
<div className="bg-primary/15 px-3 py-1.5 flex items-center gap-2">
  <div className="h-3 w-3 border border-foreground/70 rounded-sm flex-shrink-0" />
  <span className="font-semibold text-[11px]">{option.name}</span>
</div>
```

**Après** :
```tsx
<div className="bg-primary/15 px-3 py-1.5 flex items-center gap-2">
  <div className="h-3 w-3 border border-foreground/70 rounded-sm flex-shrink-0" />
  <span className="font-semibold text-[11px]">{option.name}</span>
  {option.price !== null && option.price !== undefined && (
    <span className="ml-auto text-[10px] text-primary font-medium whitespace-nowrap">
      {formatNumber(option.price)} €/mois
    </span>
  )}
</div>
```

#### 2. `src/components/rental-proposal/RentalProposalExport.tsx` — `nosOptionsHTML` (lignes 482-487)

Le template HTML du header dans `nosOptionsHTML` n'affiche pas le prix à côté du nom. Le prix est généré **à l'intérieur d'un `<div>` enfant** qui est lui-même dans un container flex `space-between`, mais le prix conditionnel est positionné en dehors du container parent du nom.

La structure actuelle (lignes 480-490) :
```html
<div style="display: flex; justify-content: space-between; align-items: flex-start;">
  <div>
    <div style="display: flex; align-items: center; justify-content: space-between; ...">
      <div style="display: flex; align-items: center; gap: 4px;">
        <span>[checkbox]</span>
        <span>[nom]</span>
      </div>
      [prix conditionnel ici]  ← Correctement placé mais dans un sous-div <div> imbriqué
    </div>
  </div>
</div>
```

Le problème est que le `justify-content: space-between` est sur le div interne, mais le div parent `<div>` qui le contient est `display: block` (pas flex). Donc le prix et le nom se retrouvent dans le même flux mais l'espace entre eux ne se distribue pas correctement. Il faut que le container principal soit directement en flex avec `justify-content: space-between`.

**Correction** : Simplifier la structure pour que le nom et le prix soient directement dans un flex `space-between` au même niveau :

```html
<div style="padding: 6px;">
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
    <div style="display: flex; align-items: center; gap: 4px;">
      <span>[checkbox]</span>
      <span>[nom]</span>
    </div>
    [prix conditionnel]
  </div>
  [description]
</div>
```

### Résultat attendu

| Section | Aperçu | PDF |
|---------|--------|-----|
| Services location | Sans prix | Sans prix |
| Services inclus additionnels | Sans prix | Sans prix |
| **Nos Options (Page 5 fusionné)** | **Avec prix `9,00 €/mois`** | **Avec prix `9,00 € / mois`** |

### Fichiers modifiés
- `src/components/rental-proposal/RentalProposalPreview.tsx` — ligne ~978-982 (bloc Page 5 fusionné)
- `src/components/rental-proposal/RentalProposalExport.tsx` — lignes ~479-492 (nosOptionsHTML)
