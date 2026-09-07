import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ENTITIES, CommercialEntity, getCommerciauxByEntity, getCommercialById } from '@/data/commerciaux';
import type { SiteAddress, OperationalContact, ExternalProvider } from '@/hooks/useServiceProposals';

export interface ClientData {
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_siret: string;
  client_capital_social: string;
  entity: CommercialEntity | '';
  commercial_id: string;
  commercial_name: string;
  site_addresses: SiteAddress[];
  operational_contact: OperationalContact;
  external_providers: ExternalProvider[];
}

export const DEFAULT_OPERATIONAL_CONTACT: OperationalContact = {
  firstName: '',
  name: '',
  role: '',
  email: '',
  phone: '',
};

function uid() {
  return Math.random().toString(36).substring(2, 9);
}

interface ServiceProposalClientStepProps {
  data: ClientData;
  onChange: (data: ClientData) => void;
}

export function ServiceProposalClientStep({ data, onChange }: ServiceProposalClientStepProps) {
  function set(key: keyof ClientData, value: string) {
    onChange({ ...data, [key]: value });
  }

  function handleEntityChange(entity: CommercialEntity | '') {
    onChange({ ...data, entity, commercial_id: '', commercial_name: '' });
  }

  function handleCommercialChange(id: string) {
    const c = getCommercialById(id);
    onChange({ ...data, commercial_id: id, commercial_name: c ? c.nom : '' });
  }

  // Sites
  function addSite() {
    onChange({
      ...data,
      site_addresses: [...(data.site_addresses ?? []), { id: uid(), label: '', address: '' }],
    });
  }
  function updateSite(id: string, patch: Partial<SiteAddress>) {
    onChange({
      ...data,
      site_addresses: (data.site_addresses ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }
  function removeSite(id: string) {
    onChange({ ...data, site_addresses: (data.site_addresses ?? []).filter((s) => s.id !== id) });
  }

  // Operational contact
  function setOpContact(key: keyof OperationalContact, value: string) {
    onChange({
      ...data,
      operational_contact: { ...(data.operational_contact ?? DEFAULT_OPERATIONAL_CONTACT), [key]: value },
    });
  }

  function addOpContact() {
    const base = data.operational_contact ?? DEFAULT_OPERATIONAL_CONTACT;
    onChange({
      ...data,
      operational_contact: {
        ...base,
        additional: [
          ...(base.additional ?? []),
          { id: uid(), firstName: '', name: '', role: '', email: '', phone: '' },
        ],
      },
    });
  }

  function updateOpContact(id: string, key: string, value: string) {
    const base = data.operational_contact ?? DEFAULT_OPERATIONAL_CONTACT;
    onChange({
      ...data,
      operational_contact: {
        ...base,
        additional: (base.additional ?? []).map((c) => (c.id === id ? { ...c, [key]: value } : c)),
      },
    });
  }

  function removeOpContact(id: string) {
    const base = data.operational_contact ?? DEFAULT_OPERATIONAL_CONTACT;
    onChange({
      ...data,
      operational_contact: {
        ...base,
        additional: (base.additional ?? []).filter((c) => c.id !== id),
      },
    });
  }

  // Providers
  function addProvider() {
    onChange({
      ...data,
      external_providers: [
        ...(data.external_providers ?? []),
        { id: uid(), name: '', role: '', contact: '' },
      ],
    });
  }
  function updateProvider(id: string, patch: Partial<ExternalProvider>) {
    onChange({
      ...data,
      external_providers: (data.external_providers ?? []).map((p) =>
        p.id === id ? { ...p, ...patch } : p,
      ),
    });
  }
  function removeProvider(id: string) {
    onChange({
      ...data,
      external_providers: (data.external_providers ?? []).filter((p) => p.id !== id),
    });
  }

  const selectedCommercial = data.commercial_id ? getCommercialById(data.commercial_id) : null;
  const op = data.operational_contact ?? DEFAULT_OPERATIONAL_CONTACT;
  const sites = data.site_addresses ?? [];
  const providers = data.external_providers ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Client</h3>
        <p className="text-sm text-muted-foreground">
          Informations du client pour cette proposition de services.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="client_name">Nom du contact</Label>
          <Input
            id="client_name"
            value={data.client_name}
            onChange={(e) => set('client_name', e.target.value)}
            placeholder="Prénom Nom"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_company">Société</Label>
          <Input
            id="client_company"
            value={data.client_company}
            onChange={(e) => set('client_company', e.target.value)}
            placeholder="Raison sociale"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_email">Email</Label>
          <Input
            id="client_email"
            type="email"
            value={data.client_email}
            onChange={(e) => set('client_email', e.target.value)}
            placeholder="email@societe.fr"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_phone">Téléphone</Label>
          <Input
            id="client_phone"
            value={data.client_phone}
            onChange={(e) => set('client_phone', e.target.value)}
            placeholder="06 00 00 00 00"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="client_address">Adresse</Label>
          <Input
            id="client_address"
            value={data.client_address}
            onChange={(e) => set('client_address', e.target.value)}
            placeholder="Adresse complète"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_siret">SIRET</Label>
          <Input
            id="client_siret"
            value={data.client_siret}
            onChange={(e) => set('client_siret', e.target.value)}
            placeholder="000 000 000 00000"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_capital_social">Capital Social</Label>
          <Input
            id="client_capital_social"
            value={data.client_capital_social}
            onChange={(e) => set('client_capital_social', e.target.value)}
            placeholder="Ex : 10 000 €"
          />
        </div>
      </div>

      {/* Sites d'intervention */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium">Sites d'intervention</h4>
              <p className="text-xs text-muted-foreground">
                Un ou plusieurs sites où les services seront exécutés.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addSite} className="gap-1">
              <Plus className="h-4 w-4" />Ajouter un site
            </Button>
          </div>

          {sites.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun site ajouté.</p>
          ) : (
            <div className="space-y-2">
              {sites.map((site) => (
                <div key={site.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-2 items-center">
                  <Input
                    value={site.label}
                    onChange={(e) => updateSite(site.id, { label: e.target.value })}
                    placeholder="Nom du site (ex: Cabinet Paris)"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={site.address}
                    onChange={(e) => updateSite(site.id, { address: e.target.value })}
                    placeholder="Adresse complète"
                    className="h-8 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSite(site.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex justify-center"
                    aria-label="Supprimer le site"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact opérationnel */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium">Contact opérationnel</h4>
              <p className="text-xs text-muted-foreground">
                Personne à contacter pour la coordination des interventions.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addOpContact} className="gap-1">
              <Plus className="h-4 w-4" />Ajouter un contact
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prénom</Label>
              <Input
                value={op.firstName ?? ''}
                onChange={(e) => setOpContact('firstName', e.target.value)}
                placeholder="Prénom"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nom</Label>
              <Input
                value={op.name}
                onChange={(e) => setOpContact('name', e.target.value)}
                placeholder="Nom"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fonction</Label>
              <Input
                value={op.role}
                onChange={(e) => setOpContact('role', e.target.value)}
                placeholder="Ex: Responsable technique"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={op.email}
                onChange={(e) => setOpContact('email', e.target.value)}
                placeholder="contact@societe.fr"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={op.phone}
                onChange={(e) => setOpContact('phone', e.target.value)}
                placeholder="06 00 00 00 00"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prestataires externes */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-medium">Prestataires externes</h4>
              <p className="text-xs text-muted-foreground">
                Partenaires ou sous-traitants intervenant sur cette proposition.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addProvider} className="gap-1">
              <Plus className="h-4 w-4" />Ajouter un prestataire
            </Button>
          </div>

          {providers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Aucun prestataire ajouté.</p>
          ) : (
            <div className="space-y-2">
              {providers.map((p) => (
                <div key={p.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input
                    value={p.name}
                    onChange={(e) => updateProvider(p.id, { name: e.target.value })}
                    placeholder="Nom du prestataire"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={p.role}
                    onChange={(e) => updateProvider(p.id, { role: e.target.value })}
                    placeholder="Rôle / prestation"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={p.contact}
                    onChange={(e) => updateProvider(p.id, { contact: e.target.value })}
                    placeholder="Email ou téléphone"
                    className="h-8 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeProvider(p.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex justify-center"
                    aria-label="Supprimer le prestataire"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium">Commercial associé</h4>
            <p className="text-xs text-muted-foreground">
              Sélectionnez l'entité et le commercial en charge de cette proposition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entité</Label>
              <Select value={data.entity} onValueChange={handleEntityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une entité..." />
                </SelectTrigger>
                <SelectContent>
                  {ENTITIES.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Commercial</Label>
              <Select
                value={data.commercial_id}
                onValueChange={handleCommercialChange}
                disabled={!data.entity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un commercial..." />
                </SelectTrigger>
                <SelectContent>
                  {data.entity &&
                    getCommerciauxByEntity(data.entity as CommercialEntity).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCommercial && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="font-medium">{selectedCommercial.nom}</div>
              {selectedCommercial.telephone && (
                <div className="text-muted-foreground">{selectedCommercial.telephone}</div>
              )}
              <div className="text-muted-foreground">{selectedCommercial.email}</div>
              <div className="text-muted-foreground text-xs mt-1">{selectedCommercial.adresse}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
