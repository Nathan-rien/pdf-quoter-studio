import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useServiceProposalStore } from '@/stores/serviceProposalStore';
import { ServiceLine } from '@/hooks/useServiceProposals';
import {
  computeTotalServicesHt,
  computePeriodicRent,
  nosOptionsToServiceLines,
} from '@/lib/service-proposal-totals';

export interface ServiceDataFormValues {
  selected_services: ServiceLine[];
  payment_frequency: 'mensuel' | 'trimestriel' | '';
  payment_mode: 'prelevement' | 'virement' | 'allin' | '';
  start_date: string;
  contract_duration: number | '';
}

interface ServiceProposalDataStepProps {
  data: ServiceDataFormValues;
  onChange: (data: ServiceDataFormValues) => void;
}

export function ServiceProposalDataStep({ data, onChange }: ServiceProposalDataStepProps) {
  const nosOptions = useServiceProposalStore((s) => s.nosOptions);
  const selectedServiceLines = nosOptionsToServiceLines(nosOptions);

  function set<K extends keyof ServiceDataFormValues>(key: K, value: ServiceDataFormValues[K]) {
    onChange({ ...data, [key]: value });
  }

  const duration = typeof data.contract_duration === 'number' ? data.contract_duration : null;
  const totalServices = computeTotalServicesHt(selectedServiceLines, duration);
  const periodicRent = computePeriodicRent(totalServices, duration, data.payment_frequency || null);

  return (
    <div className="space-y-6">
      {/* Services (lecture seule — source : onglet Nos Options) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Services sélectionnés</h4>
          <span className="text-xs text-muted-foreground">
            Gestion dans l'onglet « Nos Options »
          </span>
        </div>

        <div className="border rounded-lg p-3">
          {selectedServiceLines.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Aucun service sélectionné. Rendez-vous dans l'onglet « Nos Options ».
            </div>
          ) : (
            <ul className="divide-y">
              {selectedServiceLines.map((line) => (
                <li key={line.service_id} className="py-2 text-sm">
                  {line.label || <span className="text-muted-foreground italic">(sans nom)</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedServiceLines.length > 0 && (
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
