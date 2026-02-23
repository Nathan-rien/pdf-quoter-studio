
## Audit de securite et desactivation de l'envoi d'email

### 1. Masquer l'envoi d'email (Export)

Dans `src/components/rental-proposal/RentalProposalExport.tsx` :

- Remplacer la structure `Tabs` (onglets "Telecharger" / "Envoyer par email") par le contenu direct du telechargement PDF, sans onglets
- Supprimer les imports inutilises : `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `Mail`, `EmailSendForm`
- Supprimer les fonctions `generatePDFContent` et `generateFallbackPDFContent` qui ne servaient qu'a l'email

Le composant `EmailSendForm.tsx` reste dans le code (non supprime) pour pouvoir etre reactive plus tard.

**Resultat visuel** : le bloc export affiche directement le bouton "Telecharger le PDF" et le nom du fichier, sans aucun onglet.

### 2. Securite -- Corriger la politique RLS de `pre_registered_commercials`

La politique `Trigger function can read pre_registered_commercials` utilise `USING (true)`, ce qui expose les emails et noms de tous les commerciaux a n'importe quel utilisateur connecte.

**Correction SQL** :
```sql
DROP POLICY IF EXISTS "Trigger function can read pre_registered_commercials"
  ON pre_registered_commercials;

CREATE POLICY "Admins or own email can read pre_registered"
  ON pre_registered_commercials FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR lower(email) = lower(auth.jwt()->>'email')
  );
```

Le trigger `handle_new_user` est `SECURITY DEFINER` et bypass le RLS, donc il continue de fonctionner.

### 3. Securite -- Activer la protection contre les mots de passe compromis

Activer la verification HaveIBeenPwned dans la configuration d'authentification pour rejeter les mots de passe presents dans des fuites connues.

### 4. Securite -- Validation serveur dans la fonction Edge `send-proposal-email`

Meme si l'email est desactive cote UI, la fonction Edge reste deployee. Ajouter une validation des entrees :
- Format des emails (regex)
- Longueur du sujet (max 200 caracteres) et du message (max 10 000 caracteres)
- Valeurs numeriques positives

### Resume des fichiers modifies

| Fichier | Modification |
|---|---|
| `src/components/rental-proposal/RentalProposalExport.tsx` | Retrait des onglets email, affichage direct du PDF |
| Migration SQL | Correction politique RLS `pre_registered_commercials` |
| `supabase/functions/send-proposal-email/index.ts` | Ajout validation des entrees |
| Configuration auth | Activation leaked password protection |
