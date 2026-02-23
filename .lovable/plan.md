

## Rendre l'email et le telephone modifiables par l'admin

### Contexte
Actuellement, dans la section "Commerciaux pre-autorises", l'email est stocke en base mais affiche en lecture seule, et le telephone provient du referentiel statique (`COMMERCIAUX`). L'admin ne peut modifier ni l'un ni l'autre.

### Modifications necessaires

#### 1. Migration base de donnees
Ajouter une colonne `telephone` (texte, nullable) a la table `pre_registered_commercials`.

```text
ALTER TABLE public.pre_registered_commercials ADD COLUMN telephone text;
```

#### 2. Mise a jour du composant AccessManagement.tsx

**Affichage inline editable** : Remplacer l'affichage statique de l'email et du telephone par des champs `Input` editables directement dans les cellules du tableau.

- Chaque cellule email affichera un `Input` avec l'icone Mail
- Chaque cellule telephone affichera un `Input` avec l'icone Phone
- Un bouton "Enregistrer" (icone check) apparaitra sur la ligne lorsqu'une modification est detectee
- Les modifications seront sauvegardees via un appel `supabase.update()` sur `pre_registered_commercials`

**Etat local** : Utiliser un state `editedFields` (map par `commercial_id`) pour stocker les valeurs modifiees avant sauvegarde.

**Logique de sauvegarde** :
```text
supabase.from('pre_registered_commercials')
  .update({ email: newEmail, telephone: newTel })
  .eq('commercial_id', id)
```

#### 3. Propagation au insert (nouveau profil)
Lors de la creation d'un nouveau profil (mode referentiel), inserer aussi le telephone du commercial selectionne. En mode manuel, ajouter un champ telephone dans le formulaire (deja present dans le state `newProfile`).

### Detail technique

| Fichier | Modification |
|---|---|
| Migration SQL | Ajouter colonne `telephone` a `pre_registered_commercials` |
| `AccessManagement.tsx` | Rendre les cellules email/telephone editables inline avec sauvegarde |
| `AccessManagement.tsx` | Inserer le telephone lors de la creation de profil |
| `AccessManagement.tsx` | Fetch la colonne `telephone` dans `fetchPreRegistered` |

### Ce qui ne change pas
- La structure globale du tableau et les autres colonnes (Nom, ID Commercial, Date)
- Le referentiel statique `COMMERCIAUX`
- Les permissions RLS existantes

