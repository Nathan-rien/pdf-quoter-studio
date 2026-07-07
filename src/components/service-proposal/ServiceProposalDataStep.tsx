import { Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOptionsAdminStore } from '@/stores/optionsAdminStore';
import { ServiceLine } from '@/hooks/useServiceProposals';
import { computeTotalServicesHt, computePeriodicRent } from '@/lib/service-proposal-totals';

export interface ServiceDataFormValues {
  selected_services: ServiceLine[];
  payment_frequency: 'mensuel' | 'trimestriel' | '';
  payment_mode: 'prelevement' | 'virement' | 'allin' | '';
  start_date: string;
  contract_duration: number | '';
}

interface ServiceLineRowProps {
  line: ServiceLine;
  onUpdate: (line: ServiceLine) => void;
  onRemove: () => void;
}

function ServiceLineRow({ line, onUpdate, onRemove }: ServiceLineRowProps) {
  const showMode = line.show_price_mode ?? 'total';
  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-b-0">
      <span className="flex-1 text-sm truncate">{line.label}</span>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          step={0.01}
          value={line.amount_ht || ''}
          onChange={(e) => onUpdate({ ...line, amount_ht: parseFloat(e.target.value) || 0 })}
          className="w-28 h-8 text-sm text-right"
        />
        <span className="text-sm text-muted-foreground">€</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Afficher :</span>
        <button
          type="button"
          onClick={() => onUpdate({ ...line, show_price_mode: 'mensuel' })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            showMode === 'mensuel'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          /mois
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ ...line, show_price_mode: 'total' })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            showMode === 'total'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          total
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors"
        title="Supprimer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ServiceProposalDataStepProps {
  data: ServiceDataFormValues;
  onChange: (data: ServiceDataFormValues) => void;
}

export function ServiceProposalDataStep({ data, onChange }: ServiceProposalDataStepProps) {
  const { options: allOptions } = useOptionsAdminStore();
  const availableServices = allOptions.filter((o) => o.isActive);

  function set<K extends keyof ServiceDataFormValues>(key: K, value: ServiceDataFormValues[K]) {
    onChange({ ...data, [key]: value });
  }

  function addService(serviceId: string) {
    const found = availableServices.find((s) => s.id === serviceId);
    if (!found || data.selected_services.some((l) => l.service_id === serviceId)) return;
    set('selected_services', [
      ...data.selected_services,
      { service_id: serviceId, label: found.title, amount_ht: 0, scope: 'total', show_price_mode: 'total' },
    ]);
  }

  function updateService(idx: number, line: ServiceLine) {
    const updated = [...data.selected_services];
    updated[idx] = line;
    set('selected_services', updated);
  }

  function removeService(idx: number) {
    set('selected_services', data.selected_services.filter((_, i) => i !== idx));
  }

  const unselectedServices = availableServices.filter(
    (s) => !data.selected_services.some((l) => l.service_id === s.id)
  );

  const duration = typeof data.contract_duration === 'number' ? data.contract_duration : null;
  const totalServices = computeTotalServicesHt(data.selected_services, duration);
  const periodicRent = computePeriodicRent(totalServices, duration, data.payment_frequency || null);

  return (
    <div className="space-y-6">
      {/* Services */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Services</h4>
          {unselectedServices.length > 0 && (
            <Select onValueChange={addService} value="">
              <SelectTrigger className="w-56 h-8 text-sm">
                <SelectValue placeholder="Ajouter un service…" />
              </SelectTrigger>
              <SelectContent>
                {unselectedServices.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="border rounded-lg p-3">
          {data.selected_services.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Aucun service sélectionné.
            </div>
          ) : (
            <div>
              <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-3 text-xs text-muted-foreground font-medium pb-2 border-b">
                <span>Service</span>
                <span className="text-right">Montant HT</span>
                <span className="text-center">Afficher</span>
                <span className="text-center">Scope</span>
                <span />
              </div>
              {data.selected_services.map((line, idx) => (
                <ServiceLineRow key={line.service_id} line={line} onUpdate={(l) => updateService(idx, l)} onRemove={() => removeService(idx)} />
              ))}
            </div>
          )}
        </div>

        {data.selected_services.length > 0 && (
          <div className="flex flex-col items-end gap-2">
            <div className="text-sm font-medium">
              Total services : {totalServices.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € HT
              {!duration && (
                <span className="ml-2 text-xs text-muted-foreground">(saisir une durée pour intégrer les lignes /mois)</span>
              )}
            </div>
            {(data.payment_frequency === 'mensuel' || data.payment_frequency === 'trimestriel') && (
              periodicRent !== null ? (
                <div className="inline-flex items-baseline gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Soit</span>
                  <span className="text-base font-bold text-primary">
                    {periodicRent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                  <span className="text-xs font-medium text-primary/80">
                    {data.payment_frequency === 'mensuel' ? '/ mois HT' : '/ trimestre HT'}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">Renseigner la durée du contrat pour calculer le loyer.</div>
              )
            )}
          </div>
        )}
      </div>


      {/* Modalités */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Modalités de règlement</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Périodicité</Label>
            <div className="flex gap-2">
              {(['mensuel', 'trimestriel'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => set('payment_frequency', freq)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                    data.payment_frequency === freq
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  {freq === 'mensuel' ? 'Mensuel' : 'Trimestriel'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mode de règlement</Label>
            <div className="flex gap-2">
              {(['prelevement', 'virement', 'allin'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => set('payment_mode', mode)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                    data.payment_mode === mode
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  {mode === 'prelevement' ? 'Prélèvement' : mode === 'virement' ? 'Virement' : 'Allin'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Date de démarrage</Label>
            <Input
              id="start_date"
              type="date"
              value={data.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Durée du contrat</Label>
            <div className="flex flex-wrap items-center gap-2">
              {([12, 24, 36, 48, 60] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set('contract_duration', d)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                    data.contract_duration === d
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
                  }`}
                >
                  {d} m
                </button>
              ))}
              <div className="flex items-center gap-1 ml-2">
                <Label className="text-xs text-muted-foreground">Autre :</Label>
                <Input
                  type="number"
                  min={1}
                  value={
                    typeof data.contract_duration === 'number' &&
                    ![12, 24, 36, 48, 60].includes(data.contract_duration)
                      ? data.contract_duration
                      : ''
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    set('contract_duration', v === '' ? '' : (Number(v) as number));
                  }}
                  placeholder="mois"
                  className="w-20 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
