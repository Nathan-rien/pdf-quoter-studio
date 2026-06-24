import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { addMonths, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useContracts, isContractRenewingSoon, getMonthsUntilRenewal, Contract } from '@/hooks/useContracts';

interface ContractRenewalAlertProps {
  contract?: Contract;
}

export function ContractRenewalAlert({ contract }: ContractRenewalAlertProps) {
  const { data: allContracts = [] } = useContracts();
  const contractsToAlert = contract
    ? isContractRenewingSoon(contract) ? [contract] : []
    : allContracts.filter(isContractRenewingSoon);

  if (contractsToAlert.length === 0) return null;

  return (
    <div className="space-y-2">
      {contractsToAlert.map((c) => {
        const monthsLeft = getMonthsUntilRenewal(c);
        const endDate = c.implementation_month && c.duration_months
          ? addMonths(parseISO(c.implementation_month), c.duration_months)
          : null;
        return (
          <Alert key={c.id} variant="destructive" className="border-orange-400 bg-orange-50 text-orange-900">
            <AlertTriangle className="h-4 w-4 !text-orange-600" />
            <AlertTitle className="text-orange-900">
              Renouvellement proche — {c.client_name}
            </AlertTitle>
            <AlertDescription className="text-orange-800">
              {monthsLeft !== null && monthsLeft >= 0
                ? `Ce contrat arrive à échéance dans ${monthsLeft} mois`
                : "Ce contrat est arrivé à échéance"}
              {endDate && <> (<strong>{format(endDate, 'MMMM yyyy', { locale: fr })}</strong>).</>}{' '}
              Pensez à contacter le client pour un renouvellement.
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}
