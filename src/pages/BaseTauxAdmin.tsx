import { Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { PartnersTab } from '@/components/base-taux-admin/PartnersTab';
import { BaseTauxTab } from '@/components/base-taux-admin/BaseTauxTab';

/**
 * Administration des partenaires financiers et de la base taux (Supabase).
 * Réservé aux admins : le contrôle d'accès réel est la RLS (has_role admin) ;
 * ce garde-fou d'interface évite seulement d'afficher un écran inutilisable.
 */
export default function BaseTauxAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <p className="p-6 text-sm text-muted-foreground">Accès réservé aux administrateurs.</p>;
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Database className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Partenaires &amp; Base taux</h1>
      </div>
      <Tabs defaultValue="partners">
        <TabsList>
          <TabsTrigger value="partners">Partenaires</TabsTrigger>
          <TabsTrigger value="base-taux">Base taux</TabsTrigger>
        </TabsList>
        <TabsContent value="partners" className="mt-4">
          <PartnersTab />
        </TabsContent>
        <TabsContent value="base-taux" className="mt-4">
          <BaseTauxTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
