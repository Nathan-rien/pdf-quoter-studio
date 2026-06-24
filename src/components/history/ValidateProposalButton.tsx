import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useValidateProposal } from '@/hooks/useContracts';

interface ValidateProposalButtonProps {
  proposalId: string;
  clientName: string;
  commercialId: string;
  commercialName?: string;
  amountHt?: number;
  templateName?: string;
  financialPartner?: string;
  durationMonths?: number;
  onValidated?: (contractId: string) => void;
}

export function ValidateProposalButton({
  proposalId,
  clientName,
  commercialId,
  commercialName,
  amountHt,
  templateName,
  financialPartner,
  durationMonths,
  onValidated,
}: ValidateProposalButtonProps) {
  const [open, setOpen] = useState(false);
  const validateProposal = useValidateProposal();

  async function handleConfirm() {
    const result = await validateProposal.mutateAsync({
      proposal_id: proposalId,
      client_name: clientName,
      commercial_id: commercialId,
      commercial_name: commercialName,
      amount_ht: amountHt,
      template_name: templateName,
      financial_partner: financialPartner ?? null,
      duration_months: durationMonths ?? null,
    });
    setOpen(false);
    onValidated?.(result.id);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          title="Valider — créer un contrat"
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Valider la proposition ?</AlertDialogTitle>
          <AlertDialogDescription>
            La proposition <strong>{clientName}</strong> sera marquée comme contrat
            et apparaîtra dans l'onglet <strong>Contrats</strong>.
            {financialPartner && (
              <span className="block mt-1 text-xs text-gray-500">
                Partenaire : {financialPartner}
                {durationMonths ? ` — ${durationMonths} mois` : ''}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={validateProposal.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {validateProposal.isPending ? 'Validation…' : 'Valider'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
