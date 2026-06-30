import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Building2, Clock, Bell, Trash2, Eye } from 'lucide-react';
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
import { useUpdateContract, useDeleteContract, isContractRenewingSoon, getMonthsUntilRenewal, Contract, PaymentFrequency } from '@/hooks/useContracts';
import { calculateLoyerTrimestriel } from '@/lib/rental-calculations';
import { cn } from '@/lib/utils';


const FINANCIAL_PARTNERS = ['Lixxbail 1', 'Lixxbail 2', 'Grenke 1', 'Franfinance 1', 'Olinn 1', 'Olinn 2', 'BNP VR 2', 'BNP Credit Bail 1', 'Realease 2'];
const DURATIONS = [12, 24, 36, 48, 60];

export function ContractRow({ contract, onVisualize }: { contract: Contract; onVisualize?: (contract: Contract) => void }) {
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
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(
    contract.payment_frequency ?? 'mensuel'
  );

  const endDate = implementationMonth && durationMonths
    ? addMonths(parseISO(`${implementationMonth}-01`), parseInt(durationMonths))
    : null;

  const displayedAmount = contract.amount_ht != null
    ? (paymentFrequency === 'trimestriel'
        ? (calculateLoyerTrimestriel(contract.amount_ht) ?? contract.amount_ht * 3)
        : contract.amount_ht)
    : null;

  function handleSave() {
    updateContract.mutate({
      id: contract.id,
      updates: {
        implementation_month: implementationMonth ? `${implementationMonth}-01` : null,
        financial_partner: financialPartner || null,
        duration_months: durationMonths ? parseInt(durationMonths) : null,
        payment_frequency: paymentFrequency,
      },
    });
  }


  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left items-center cursor-pointer"
        role="button"
        tabIndex={0}
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
            {displayedAmount != null && (
              <span>
                {displayedAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € ({paymentFrequency})
              </span>
            )}

            {contract.financial_partner && <span>{contract.financial_partner}</span>}
            {contract.duration_months && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{contract.duration_months} mois</span>}
            {endDate && <span>→ {format(endDate, 'MM/yyyy', { locale: fr })}</span>}
          </div>
          {contract.template_name && (
            <div className="text-[11px] text-muted-foreground">{contract.template_name}</div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 flex-shrink-0"
          title="Visualiser la proposition"
          onClick={(e) => {
            e.stopPropagation();
            onVisualize?.(contract);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>
        <AlertDialog>

          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
              title="Supprimer le contrat"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le contrat ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le contrat de <strong>{contract.client_name}</strong> sera définitivement supprimé. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteContract.mutate(contract.id)}
                disabled={deleteContract.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteContract.isPending ? 'Suppression…' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Select key={`fp-${contract.id}`} value={financialPartner} onValueChange={setFinancialPartner}>
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
              <Select key={`dm-${contract.id}`} value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => <SelectItem key={d} value={String(d)}>{d} mois</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Périodicité</Label>
              <div className="flex gap-2">
                {(['mensuel', 'trimestriel'] as PaymentFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPaymentFrequency(f)}
                    className={cn(
                      'h-9 px-4 rounded-full text-sm font-medium border transition-colors capitalize',
                      paymentFrequency === f
                        ? 'bg-black text-white border-black'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
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
