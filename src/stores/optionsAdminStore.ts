import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServiceOptionDefinition, OptionsAdminState } from '@/types/options-admin';

const generateId = () => crypto.randomUUID();

// Options pré-remplies basées sur les captures d'écran
const defaultOptions: ServiceOptionDefinition[] = [
  {
    id: generateId(),
    title: 'Services Inclus',
    services: [
      'Contrat de location et gestion administrative',
      'Optimisation des coûts et gestion budgétaire',
      'Gestion des évolutions du parc',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Tection',
    services: [
      'Assurance casse et vol du matériel',
      'Remplacement sous 48h en cas de sinistre',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Actif',
    subtitle: 'reprise de parc',
    services: [
      'Audit et valorisation du parc existant',
      'Enlèvement et reprise de parc',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Flex',
    services: [
      'Flexibilité des échéances de paiement',
      'Ajustement du contrat en cours de période',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Spare',
    services: [
      'Stock de matériel de remplacement',
      'Échange standard en cas de panne',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Optimisée',
    services: [
      'Optimisation fiscale de la location',
      'Étude personnalisée de financement',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-maintenance',
    services: [
      'Maintenance préventive du matériel',
      'Support technique dédié',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Lease back',
    services: [
      'Rachat de votre parc existant',
      'Conversion en contrat de location',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-duction',
    services: [
      'Installation et déploiement sur site',
      'Masterisation des équipements',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-support informatique',
    services: [
      'Technical account manager (TAM) dédié au compte',
      'Prise en main à distance SAV',
      'Ouverture des tickets SAV',
    ],
    price: {
      amount: 9.00,
      unit: '€ HT / mois / Machine',
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-license',
    services: [
      'Gestion des licences logicielles',
      'Suivi des renouvellements',
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useOptionsAdminStore = create<OptionsAdminState>()(
  persist(
    (set) => ({
      options: defaultOptions,

      addOption: (option) =>
        set((state) => ({
          options: [
            ...state.options,
            {
              ...option,
              id: generateId(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateOption: (id, updates) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === id
              ? { ...opt, ...updates, updatedAt: new Date() }
              : opt
          ),
        })),

      deleteOption: (id) =>
        set((state) => ({
          options: state.options.filter((opt) => opt.id !== id),
        })),

      addServiceToOption: (optionId, service) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  services: [...opt.services, service],
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      updateService: (optionId, serviceIndex, newValue) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  services: opt.services.map((s, i) =>
                    i === serviceIndex ? newValue : s
                  ),
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      removeService: (optionId, serviceIndex) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  services: opt.services.filter((_, i) => i !== serviceIndex),
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      setOptionPrice: (optionId, amount, unit) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  price: { amount, unit },
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      removeOptionPrice: (optionId) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  price: undefined,
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      toggleOptionActive: (optionId) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? { ...opt, isActive: !opt.isActive, updatedAt: new Date() }
              : opt
          ),
        })),
    }),
    {
      name: 'options-admin-storage',
    }
  )
);
