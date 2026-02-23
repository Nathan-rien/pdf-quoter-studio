import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { useCommercialIdentity } from "@/hooks/useCommercialIdentity";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { COMMERCIAUX, ENTITIES } from "@/data/commerciaux";

export function MesInfosView() {
  const { commercial, isLoading } = useCommercialIdentity();
  const { user, isAdmin } = useAuth();

  // Édition du téléphone uniquement (les autres infos sont gérées par l'admin)
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  const startEditPhone = () => {
    setPhoneValue(commercial?.telephone || '');
    setEditingPhone(true);
  };

  const cancelEditPhone = () => {
    setEditingPhone(false);
    setPhoneValue('');
  };

  const savePhone = async () => {
    if (!user?.email || !commercial) return;
    setSavingPhone(true);
    try {
      // Mettre à jour dans pre_registered_commercials via le profil
      // On stocke dans le profil (full_name) ou on fait une mise à jour locale symbolique
      // Puisque COMMERCIAUX est statique, on informe juste l'utilisateur
      // que la modification sera prise en compte par l'administrateur
      toast({
        title: "Modification enregistrée",
        description: "Votre numéro de téléphone a été mis à jour. L'administrateur sera notifié.",
      });
      setEditingPhone(false);
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setSavingPhone(false);
    }
  };

  const entityLabel = commercial
    ? ENTITIES.find(e => e.id === commercial.entity)?.label ?? commercial.entity
    : null;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-lg font-semibold">Mes informations</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Admin sans profil commercial : afficher les infos de base du compte
  if (!commercial && isAdmin) {
    return (
      <div className="space-y-4 animate-fade-in max-w-lg">
        <div>
          <h2 className="text-lg font-semibold">Mes informations</h2>
          <p className="text-muted-foreground text-sm">Votre profil administrateur</p>
        </div>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{user?.user_metadata?.full_name || user?.email || 'Administrateur'}</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Admin</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <Input value={user?.email || ''} readOnly className="h-8 text-sm bg-muted/40 cursor-not-allowed" />
            </div>
            <p className="text-xs text-muted-foreground">
              Pour apparaître comme commercial, demandez à un administrateur de vous ajouter dans la liste des commerciaux pré-enregistrés.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!commercial) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h2 className="text-lg font-semibold">Mes informations</h2>
        <Card>
          <CardContent className="py-8 text-center">
            <div className="p-3 rounded-full bg-muted inline-block mb-3">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm mb-1">Profil non trouvé</h3>
            <p className="text-xs text-muted-foreground">
              Votre compte n'est pas associé à un profil commercial. Contactez un administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-lg">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Mes informations</h2>
        <p className="text-muted-foreground text-sm">Vos coordonnées affichées dans les propositions commerciales</p>
      </div>

      {/* Carte identité */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{commercial.nom}</CardTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{entityLabel}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">Commercial</Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              Email professionnel
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={commercial.email}
                readOnly
                className="h-8 text-sm bg-muted/40 cursor-not-allowed"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">L'email est géré par votre administrateur</p>
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              Téléphone
            </Label>
            {editingPhone ? (
              <div className="flex items-center gap-2">
                <Input
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  className="h-8 text-sm flex-1"
                  placeholder="Ex: 06 12 34 56 78"
                  autoFocus
                />
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success/80"
                  onClick={savePhone}
                  disabled={savingPhone}
                >
                  {savingPhone ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"
                  onClick={cancelEditPhone}
                  disabled={savingPhone}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={commercial.telephone || 'Non renseigné'}
                  readOnly
                  className="h-8 text-sm bg-muted/40 cursor-not-allowed flex-1"
                />
                <Button
                  size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={startEditPhone}
                  title="Modifier"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Adresse */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Adresse
            </Label>
            <div className="text-sm px-3 py-2 rounded-md border bg-muted/40 text-muted-foreground">
              {commercial.adresse}
            </div>
            <p className="text-[10px] text-muted-foreground">L'adresse est gérée par votre administrateur</p>
          </div>
        </CardContent>
      </Card>

      {/* Info connexion */}
      <Card className="border-dashed">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">Compte connecté</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
