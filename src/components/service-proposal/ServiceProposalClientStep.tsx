import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { ENTITIES, CommercialEntity, getCommerciauxByEntity, getCommercialById } from '@/data/commerciaux';

export interface ClientData {
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  client_siret: string;
  entity: CommercialEntity | '';
  commercial_id: string;
  commercial_name: string;
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

  const selectedCommercial = data.commercial_id ? getCommercialById(data.commercial_id) : null;

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
      </div>

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
