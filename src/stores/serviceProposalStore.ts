import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServiceProposal } from '@/hooks/useServiceProposals';

export interface ClientData {
  nom: string;
  raisonSociale: string;
  email: string;
  telephone: string;
  adresse: string;
  siret: string;
}

export interface CommercialData {
  entity: string | null;
  commercialId: string | null;
}

export interface LigneData {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  totalHT: number;
}

export interface SelectedService {
  service_id: string;
  label: string;
  amount_ht: number;
  scope: 'total' | 'parc';
}

export interface ServiceProposalStoreState {
  clientData: ClientData;
  commercialData: CommercialData;
  lignesData: LigneData[];
  servicesInclus: { description: string };
  selectedTemplateId: string | null;
  proposalName: string;
  totalInvest: number;
  selectedServices: SelectedService[];
  paymentFrequency: string;
  paymentMode: string;
  contractDuration: number | null;
  startDate: string;
  totalServicesHt: number;
}

const DEFAULT_SERVICES_INCLUS_DESCRIPTION =
  'Contrat de location et gestion administrative\nOptimisation des coûts et gestion budgétaire\nGestion des évolutions (ajout / retrait de matériels en cours de contrat)\nAccès privilégié aux matériels de seconde vie\nGarantie de recyclage / valorisation du matériel en fin de vie (DEEE)\nMise à disposition du matériel informatique (location possible au-delà de la durée du contrat)';

const initialState: ServiceProposalStoreState = {
  clientData: {
    nom: '',
    raisonSociale: '',
    email: '',
    telephone: '',
    adresse: '',
    siret: '',
  },
  commercialData: {
    entity: null,
    commercialId: null,
  },
  lignesData: [],
  servicesInclus: {
    description: DEFAULT_SERVICES_INCLUS_DESCRIPTION,
  },
  selectedTemplateId: null,
  proposalName: '',
  totalInvest: 0,
  selectedServices: [],
  paymentFrequency: '',
  paymentMode: '',
  contractDuration: null,
  startDate: '',
  totalServicesHt: 0,
};

interface ServiceProposalStoreActions {
  updateClientData: (data: Partial<ClientData>) => void;
  updateCommercialData: (data: Partial<CommercialData>) => void;
  setLignesData: (lines: LigneData[]) => void;
  updateServicesInclus: (description: string) => void;
  selectTemplate: (id: string | null) => void;
  updateProposalName: (name: string) => void;
  setContractData: (data: {
    selectedServices: SelectedService[];
    paymentFrequency: string;
    paymentMode: string;
    contractDuration: number | null;
    startDate: string;
    totalServicesHt: number;
  }) => void;
  resetAll: () => void;
  loadFromServiceProposal: (proposal: ServiceProposal) => void;
}

export type ServiceProposalStore = ServiceProposalStoreState & ServiceProposalStoreActions;

export const useServiceProposalStore = create<ServiceProposalStore>()(
  persist(
    (set) => ({
      ...initialState,

      updateClientData: (data) =>
        set((state) => ({
          clientData: { ...state.clientData, ...data },
        })),

      updateCommercialData: (data) =>
        set((state) => ({
          commercialData: { ...state.commercialData, ...data },
        })),

      setLignesData: (lines) =>
        set(() => ({
          lignesData: lines,
          totalInvest: Math.round(lines.reduce((sum, l) => sum + l.totalHT, 0) * 100) / 100,
        })),

      updateServicesInclus: (description) =>
        set(() => ({
          servicesInclus: { description },
        })),

      selectTemplate: (id) =>
        set(() => ({
          selectedTemplateId: id,
        })),

      updateProposalName: (name) =>
        set(() => ({
          proposalName: name,
        })),

      setContractData: (data) => set((state) => ({ ...state, ...data })),

      resetAll: () => set(() => ({ ...initialState })),

      loadFromServiceProposal: (proposal) =>
        set(() => ({
          clientData: {
            nom: proposal.client_name ?? '',
            raisonSociale: proposal.client_company ?? '',
            email: proposal.client_email ?? '',
            telephone: proposal.client_phone ?? '',
            adresse: proposal.client_address ?? '',
            siret: proposal.client_siret ?? '',
          },
          commercialData: {
            entity: null,
            commercialId: proposal.commercial_id ?? null,
          },
          lignesData: proposal.invest_lines.map((line) => ({
            id: line.id,
            designation: line.designation,
            quantite: line.qty,
            prixUnitaire: line.vun,
            totalHT: line.vtn,
          })),
          totalInvest:
            Math.round(proposal.invest_lines.reduce((sum, l) => sum + l.vtn, 0) * 100) / 100,
          servicesInclus: { description: DEFAULT_SERVICES_INCLUS_DESCRIPTION },
          proposalName: proposal.client_company || proposal.client_name || 'Proposition Services',
          selectedTemplateId: null,
          selectedServices: proposal.selected_services ?? [],
          paymentFrequency: proposal.payment_frequency ?? '',
          paymentMode: proposal.payment_mode ?? '',
          contractDuration: proposal.contract_duration ?? null,
          startDate: proposal.start_date ?? '',
          totalServicesHt:
            Math.round(
              (proposal.selected_services ?? []).reduce((s, l) => s + l.amount_ht, 0) * 100,
            ) / 100,
        })),
    }),
    {
      name: 'service-proposal-storage',
      partialize: (state) => ({
        clientData: state.clientData,
        commercialData: state.commercialData,
        lignesData: state.lignesData,
        servicesInclus: state.servicesInclus,
        selectedTemplateId: state.selectedTemplateId,
        proposalName: state.proposalName,
        totalInvest: state.totalInvest,
        selectedServices: state.selectedServices,
        paymentFrequency: state.paymentFrequency,
        paymentMode: state.paymentMode,
        contractDuration: state.contractDuration,
        startDate: state.startDate,
        totalServicesHt: state.totalServicesHt,
      }),
    }
  )
);
