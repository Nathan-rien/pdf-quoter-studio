

# Plan : Authentification Admin avec gestion des acces

## Resume

Implementation d'un systeme d'authentification complet avec :
- Page de connexion/inscription
- Gestion des roles (admin, user) dans une table separee
- Onglet "Acces" visible uniquement par les admins pour gerer les utilisateurs
- Protection des pages d'administration

## Architecture

```text
+------------------+     +------------------+     +------------------+
|   Page /auth     |---->|  Session check   |---->|   Main App       |
|  Login/Signup    |     |  (AuthProvider)  |     |  with Sidebar    |
+------------------+     +------------------+     +------------------+
                                                         |
                              +---------------------------+
                              |
                    +---------+---------+
                    |                   |
             +------v------+    +-------v-------+
             | User normal |    | Admin         |
             | (Proposition|    | (+Acces tab)  |
             | Historique) |    |               |
             +-------------+    +---------------+
```

## Etape 1 : Migration base de donnees

### 1.1 Creation du type enum pour les roles

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
```

### 1.2 Table des roles utilisateurs

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

### 1.3 Table des profils utilisateurs

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### 1.4 Fonction securisee has_role

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

### 1.5 Politiques RLS

```sql
-- Profiles: lecture par tous les authentifies, ecriture par le proprietaire
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles: admins peuvent tout gerer
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

### 1.6 Trigger pour creer le profil automatiquement

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Etape 2 : Hooks et contexte d'authentification

### 2.1 Fichier `src/hooks/useAuth.ts`

Hook personnalise pour gerer l'etat d'authentification :

```typescript
// Expose:
// - user: User | null
// - session: Session | null
// - isAdmin: boolean
// - isLoading: boolean
// - signIn(email, password)
// - signUp(email, password, fullName)
// - signOut()
```

## Etape 3 : Page d'authentification

### 3.1 Fichier `src/pages/Auth.tsx`

- Formulaire de connexion et inscription
- Validation avec Zod (email, mot de passe min 6 caracteres)
- Gestion des erreurs (utilisateur deja existant, mauvais identifiants)
- Redirection vers `/` apres connexion reussie
- Design coherent avec l'application existante

## Etape 4 : Composant de gestion des acces

### 4.1 Fichier `src/components/access/AccessManagement.tsx`

Interface pour les admins permettant de :
- Voir la liste des utilisateurs avec leurs roles
- Creer un nouvel utilisateur (via invitation ou creation directe)
- Modifier le role d'un utilisateur (admin/user)
- Supprimer un utilisateur

## Etape 5 : Mise a jour de l'application

### 5.1 Modification `src/App.tsx`

- Ajouter route `/auth`
- Ajouter composant `ProtectedRoute` pour proteger les pages

### 5.2 Modification `src/pages/Index.tsx`

- Verifier l'authentification
- Rediriger vers `/auth` si non connecte
- Ajouter la vue `access-management` dans le switch

### 5.3 Modification `src/components/layout/AppSidebar.tsx`

- Ajouter le type `'access-management'` a `ViewType`
- Ajouter bouton "Acces" visible uniquement pour les admins (icone Users)
- Ajouter bouton de deconnexion dans le footer

## Etape 6 : Premier administrateur

Apres la creation du compte, il faudra ajouter manuellement le role admin au premier utilisateur :

```sql
-- A executer une fois apres la premiere inscription
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'votre-email@example.com';
```

## Fichiers a creer

| Fichier | Description |
|---------|-------------|
| `src/hooks/useAuth.ts` | Hook d'authentification |
| `src/pages/Auth.tsx` | Page connexion/inscription |
| `src/components/access/AccessManagement.tsx` | Gestion des utilisateurs |
| `src/components/auth/ProtectedRoute.tsx` | Protection des routes |

## Fichiers a modifier

| Fichier | Modification |
|---------|--------------|
| `src/App.tsx` | Ajouter route `/auth` et ProtectedRoute |
| `src/pages/Index.tsx` | Ajouter verification auth et vue access |
| `src/components/layout/AppSidebar.tsx` | Ajouter onglet Acces et bouton deconnexion |

## Securite

- Roles stockes dans une table separee (jamais dans profiles)
- Fonction `has_role()` en SECURITY DEFINER pour eviter la recursion RLS
- Validation des inputs avec Zod
- Token de session gere par Supabase Auth
- emailRedirectTo configure pour la confirmation email

