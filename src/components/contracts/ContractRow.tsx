import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Building2, Clock, Bell, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format, parseISO, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUpdateContract, useDeleteContract, isContractRenewingSoon, getMonthsUntilRenewal, Contract } from '@/hooks/useContracts';

const FINANCIAL_PARTNERS = ['Lixxbail 1', 'Lixxbail 2', 'Grenke 1', 'Franfinance 1', 'Olinn 1', 'Olinn 2', 'BNP VR 2', 'BNP Credit Bail 1', 'Realease 2'];
const DURATIONS = [12, 24, 36, 48, 60];

export function ContractRow({ contract }: { contract: Contract }) {
  const [expanded, setExpanded] = useState(false);
  const updateContract = useUpdateContract();
  const deleteContract = useDeleteContract();
  const renewing = isContractRenewingSoon(contract);
  const monthsLeft = getMonthsUntilRenewal(contract);

  const [implementationMonth, setImplementationMonth] = useState(
    contract.implementation_month ? contract.implementation_month.substring(0, 7) : ''
  );
  const [financialPartner, setFinancialPartner] = useState(contract.financial_partner ?? '');
  const [durationMonths, setDurationMonths] = useState(
    contract.duration_months ? String(contract.duration_months) : ''
  );

  const endDate = implementationMonth && durationMonths
    ? addMonths(parseISO(`${implementationMonth}-01`), parseInt(durationMonths))
    : null;

  function handleSave() {
    updateContract.mutate({
      id: contract.id,
      updates: {
        implementation_month: implementationMonth ? `${implementationMonth}-01` : null,
        financial_partner: financialPartner || null,
        duration_months: durationMonths ? parseInt(durationMonths) : null,
      },
    });
  }

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_auto] gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left items-center"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{contract.client_name}</span>
            {renewing && (
              <Badge variant="warning" className="gap-1">
                <Bell className="h-3 w-3" />
                Renouvellement dans {monthsLeft}m
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(parseISO(contract.validated_at), 'dd/MM/yyyy', { locale: fr })}
            </span>
            {contract.amount_ht != null && (
              <span>{contract.amount_ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</span>
            )}
            {contract.financial_partner && <span>{contract.financial_partner}</span>}
            {contract.duration_months && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{contract.duration_months} mois</span>}
            {endDate && <span>→ {format(endDate, 'MM/yyyy', { locale: fr })}</span>}
          </div>
          {contract.template_name && (
            <div className="text-[11px] text-muted-foreground">{contract.template_name}</div>
          )}
        </div>
        <div className="text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Mois de mise en place</Label>
              <Input
                type="month"
                value={implementationMonth}
                onChange={(e) => setImplementationMonth(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Partenaire financier</Label>
              <Select value={financialPartner} onValueChange={setFinancialPartner}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {FINANCIAL_PARTNERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Durée (mois)</Label>
              <Select value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} mois</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {endDate && (
            <div className="text-xs text-muted-foreground">
              Date de fin estimée : <strong>{format(endDate, 'MMMM yyyy', { locale: fr })}</strong>
            </div>
          )}
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={updateContract.isPending}>
              {updateContract.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
