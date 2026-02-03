

# Plan : Ajouter le role Commercial

## Resume

Ajout d'un nouveau role "commercial" qui permet d'acceder aux fonctionnalites de proposition locative et historique, mais pas a la section Administration (Editeur Template, Options Services, Base Taux, Acces).

## Hierarchie des roles

| Role | Proposition | Historique | Administration |
|------|-------------|------------|----------------|
| Admin | Oui | Oui | Oui (complet) |
| Commercial | Oui | Oui | Non |
| User | Oui | Oui | Non |

## Etape 1 : Migration base de donnees

### 1.1 Ajouter la valeur "commercial" a l'enum app_role

```sql
ALTER TYPE public.app_role ADD VALUE 'commercial';
```

### 1.2 Mettre a jour les politiques RLS (optionnel)

Les politiques RLS existantes permettent deja aux utilisateurs de voir leur propre role. Aucune modification necessaire pour l'instant.

## Etape 2 : Modifications du hook useAuth

### Fichier `src/hooks/useAuth.ts`

Ajouter la detection du role "commercial" :

```typescript
interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isCommercial: boolean;  // Nouveau
  userRole: 'admin' | 'commercial' | 'user' | null;  // Nouveau
  isLoading: boolean;
  // ...
}
```

Modifier la fonction `checkAdminRole` pour recuperer le role complet :

```typescript
const checkUserRole = async (userId: string) => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (data) {
    setUserRole(data.role);
    setIsAdmin(data.role === 'admin');
    setIsCommercial(data.role === 'commercial');
  }
};
```

## Etape 3 : Modifications de la sidebar

### Fichier `src/components/layout/AppSidebar.tsx`

Ajouter la prop `canAccessAdmin` pour controler l'affichage de la section Administration :

```typescript
interface AppSidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isAdmin?: boolean;
  canAccessAdmin?: boolean;  // Nouveau - true pour admin, false pour commercial/user
  onSignOut?: () => void;
}
```

Conditionner l'affichage de la section Administration :

```tsx
{/* Section Administration - masquee pour les commerciaux */}
{canAccessAdmin && (
  <div className="pt-3 mt-3 border-t border-border">
    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-2">
      Administration
    </p>
    {/* Boutons Template Editor, Options Services, Base Taux */}
    {isAdmin && (
      <Button onClick={() => onNavigate('access-management')}>Acces</Button>
    )}
  </div>
)}
```

## Etape 4 : Mise a jour de la page Index

### Fichier `src/pages/Index.tsx`

Passer la prop `canAccessAdmin` basee sur le role :

```tsx
const { isAdmin, userRole, signOut } = useAuth();
const canAccessAdmin = userRole === 'admin'; // Seul admin peut acceder

<AppSidebar
  currentView={currentView}
  onNavigate={setCurrentView}
  isAdmin={isAdmin}
  canAccessAdmin={canAccessAdmin}
  onSignOut={signOut}
/>
```

## Etape 5 : Mise a jour de la gestion des acces

### Fichier `src/components/access/AccessManagement.tsx`

Ajouter le role "Commercial" dans le select :

```tsx
<SelectContent>
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="commercial">Commercial</SelectItem>  {/* Nouveau */}
  <SelectItem value="user">Utilisateur</SelectItem>
</SelectContent>
```

Mettre a jour l'interface et les badges :

```tsx
interface UserWithRole {
  // ...
  role: 'admin' | 'commercial' | 'user' | null;
}

// Dans le rendu
{user.role === 'commercial' && (
  <Badge variant="outline" className="border-blue-500 text-blue-600">Commercial</Badge>
)}
```

## Fichiers a modifier

| Fichier | Modification |
|---------|--------------|
| Migration SQL | Ajouter 'commercial' a l'enum app_role |
| `src/hooks/useAuth.ts` | Ajouter detection du role commercial + userRole |
| `src/components/layout/AppSidebar.tsx` | Conditionner l'affichage de la section Admin |
| `src/pages/Index.tsx` | Passer canAccessAdmin a la sidebar |
| `src/components/access/AccessManagement.tsx` | Ajouter option Commercial dans le select |

## Resultat attendu

- Les commerciaux voient uniquement "Proposition" et "Historique"
- La section "Administration" est completement masquee pour les commerciaux
- Les admins peuvent assigner le role "Commercial" depuis l'onglet Acces
- Le role s'affiche avec un badge bleu distinctif

