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
  contract_number?: string | null;
  monthly_rent_ht?: number | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  validated_at: string;
  created_at: string;
  updated_at: string;
}

export interface ContractUpdate {
  implementation_month?: string | null;
  financial_partner?: string | null;
  duration_months?: number | null;
  payment_frequency?: PaymentFrequency;
  commercial_id?: string;
  commercial_name?: string;
  contract_number?: string | null;
  monthly_rent_ht?: number | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
}

