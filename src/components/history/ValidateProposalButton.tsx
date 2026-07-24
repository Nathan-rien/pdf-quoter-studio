import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { useValidateProposal, ProposalType } from '@/hooks/useContracts';
import { supabase } from '@/integrations/supabase/client';
import { generateAndUploadServiceContractPdf } from '@/lib/service-contract-generator';
import { seedClientServiceReferences } from '@/lib/technician-tracking';

interface ValidateProposalButtonProps {
  proposalId: string;
  clientName: string;
  commercialId: string;
  commercialName?: string;
  amountHt?: number;
  monthlyRentHt?: number;
  templateName?: string;
  financialPartner?: string;
  durationMonths?: number;
  proposalType?: ProposalType;
  onValidated?: (contractId: string) => void;
}

export function ValidateProposalButton({
  proposalId,
  clientName,
  commercialId,
  commercialName,
  amountHt,
  monthlyRentHt,
  templateName,
  financialPartner,
  durationMonths,
  proposalType = 'location',
  onValidated,
}: ValidateProposalButtonProps) {
  const [open, setOpen] = useState(false);
  const [isFinalizingContract, setIsFinalizingContract] = useState(false);
  const validateProposal = useValidateProposal();
  const queryClient = useQueryClient();

  async function handleConfirm() {
    // For Service proposals, pull duration / start date / periodicity from the
    // linked service_proposal so the created contract is pre-filled.
    let servicePrefill: {
      duration_months?: number | null;
      implementation_month?: string | null;
      payment_frequency?: 'mensuel' | 'trimestriel';
      monthly_rent_ht?: number | null;
      quarterly_rent_ht?: number | null;
      external_providers?: unknown[];
    } = {};
    let servicePropId: string | null = null;

    if (proposalType === 'service') {
      const { data: exp } = await supabase
        .from('proposal_exports')
        .select('service_proposal_id')
        .eq('id', proposalId)
        .maybeSingle();
      servicePropId = (exp as any)?.service_proposal_id ?? null;

      if (servicePropId) {
        const { data: sp } = await supabase
          .from('service_proposals')
          .select('contract_duration, start_date, payment_frequency, external_providers')
          .eq('id', servicePropId)
          .maybeSingle();
        if (sp) {
          const duration = (sp as any).contract_duration ?? null;
          const freq = (sp as any).payment_frequency;
          const total = typeof amountHt === 'number' ? amountHt : null;
          const monthly =
            total != null && duration && duration > 0
              ? Math.round((total / duration) * 100) / 100
              : null;
          const quarterly =
            monthly != null ? Math.round(monthly * 3 * 100) / 100 : null;
          servicePrefill = {
            duration_months: duration,
            implementation_month: (sp as any).start_date ?? null,
            payment_frequency:
              freq === 'trimestriel' ? 'trimestriel' : freq === 'mensuel' ? 'mensuel' : undefined,
            monthly_rent_ht: monthly,
            quarterly_rent_ht: quarterly,
            external_providers: Array.isArray((sp as any).external_providers) ? (sp as any).external_providers : [],
          };
        }
      }
    }

    setIsFinalizingContract(true);
    try {
      const result = await validateProposal.mutateAsync({
        proposal_id: proposalId,
        proposal_type: proposalType,
        client_name: clientName,
        commercial_id: commercialId,
        commercial_name: commercialName,
        amount_ht: amountHt,
        monthly_rent_ht: servicePrefill.monthly_rent_ht ?? monthlyRentHt,
        quarterly_rent_ht: servicePrefill.quarterly_rent_ht,
        template_name: templateName,
        financial_partner: financialPartner ?? null,
        duration_months: servicePrefill.duration_months ?? durationMonths ?? null,
        implementation_month: servicePrefill.implementation_month ?? null,
        payment_frequency: servicePrefill.payment_frequency,
        external_providers: servicePrefill.external_providers ?? [],
      });

      if (proposalType === 'service') {
        try {
          const uploaded = await generateAndUploadServiceContractPdf({
            proposalId,
            contractId: result.id,
            clientName,
          });
          if (uploaded) {
            const { error: updateError } = await supabase
              .from('contracts')
              .update({ attachment_url: uploaded.path, attachment_name: uploaded.name })
              .eq('id', result.id);
            if (updateError) throw updateError;
          }
          await seedClientServiceReferences({
            contractId: result.id,
            serviceProposalId: servicePropId,
          });
          await queryClient.invalidateQueries({ queryKey: ['contracts'] });
        } catch (err) {
          console.error('[ValidateProposalButton] génération contrat automatique échouée', err);
        }
      }

      setOpen(false);
      onValidated?.(result.id);
    } finally {
      setIsFinalizingContract(false);
    }
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
            disabled={validateProposal.isPending || isFinalizingContract}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {validateProposal.isPending
              ? 'Validation…'
              : isFinalizingContract
                ? 'Génération contrat…'
                : 'Valider'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
