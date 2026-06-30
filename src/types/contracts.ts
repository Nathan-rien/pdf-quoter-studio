export type PaymentFrequency = 'mensuel' | 'trimestriel';

export interface Contract {
  id: string;
  proposal_id: string;
  client_name: string;
  commercial_id: string;
  commercial_name?: string;
  amount_ht?: number;
  template_name?: string;
  implementation_month?: string | null;
  financial_partner?: string | null;
  duration_months?: number | null;
  payment_frequency?: PaymentFrequency;
  validated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContractUpdate {
  implementation_month?: string | null;
  financial_partner?: string | null;
  duration_months?: number | null;
  payment_frequency?: PaymentFrequency;
}
