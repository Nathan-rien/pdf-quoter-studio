import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServiceOptionDefinition, OptionsAdminState, ServiceItem } from '@/types/options-admin';

const generateId = () => crypto.randomUUID();

// Helper pour convertir une string en ServiceItem
const toServiceItem = (text: string): ServiceItem => ({ text });

// Options pré-remplies basées sur les captures d'écran
// NOTE: "Services Inclus" a été retiré car c'est maintenant un bloc permanent dans le store rental-proposal
const defaultOptions: ServiceOptionDefinition[] = [
  {
    id: generateId(),
    title: 'Pro-Tection',
    services: [
      { text: 'Assurance casse et vol du matériel' },
      { text: 'Remplacement sous 48h en cas de sinistre' },
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
      { text: 'Audit et valorisation du parc existant' },
      { text: 'Enlèvement et reprise de parc' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Flex',
    services: [
      { text: 'Flexibilité des échéances de paiement' },
      { text: 'Ajustement du contrat en cours de période' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Spare',
    services: [
      { text: 'Stock de matériel de remplacement' },
      { text: 'Échange standard en cas de panne' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-Optimisée',
    services: [
      { text: 'Optimisation fiscale de la location' },
      { text: 'Étude personnalisée de financement' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-maintenance',
    services: [
      { text: 'Maintenance préventive du matériel' },
      { text: 'Support technique dédié' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Lease back',
    services: [
      { text: 'Rachat de votre parc existant' },
      { text: 'Conversion en contrat de location' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-duction',
    services: [
      { text: 'Installation et déploiement sur site' },
      { text: 'Masterisation des équipements' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: generateId(),
    title: 'Pro-support informatique',
    services: [
      { text: 'Technical account manager (TAM) dédié au compte' },
      { 
        text: 'Prise en main à distance SAV (Diagnostic et intervention)',
        subItems: [
          'Niveau 1 : premier diagnostic du besoin pour résolution rapide',
          'Niveau 2 : interventions poussées sur un incident gênant voir bloquant',
        ]
      },
      { text: 'Ouverture des tickets SAV' },
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
      { text: 'Gestion des licences logicielles' },
      { text: 'Suivi des renouvellements' },
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Migration helper: convertir les anciens services (string[]) vers le nouveau format (ServiceItem[])
const migrateServices = (services: (string | ServiceItem)[]): ServiceItem[] => {
  return services.map(service => 
    typeof service === 'string' ? { text: service } : service
  );
};

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
                  services: [...migrateServices(opt.services), toServiceItem(service)],
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
                  services: migrateServices(opt.services).map((s, i) =>
                    i === serviceIndex ? { ...s, text: newValue } : s
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
                  services: migrateServices(opt.services).filter((_, i) => i !== serviceIndex),
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      addSubItemToService: (optionId, serviceIndex, subItem) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  services: migrateServices(opt.services).map((s, i) =>
                    i === serviceIndex
                      ? { ...s, subItems: [...(s.subItems || []), subItem] }
                      : s
                  ),
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      updateSubItem: (optionId, serviceIndex, subItemIndex, newValue) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  services: migrateServices(opt.services).map((s, i) =>
                    i === serviceIndex && s.subItems
                      ? {
                          ...s,
                          subItems: s.subItems.map((sub, si) =>
                            si === subItemIndex ? newValue : sub
                          ),
                        }
                      : s
                  ),
                  updatedAt: new Date(),
                }
              : opt
          ),
        })),

      removeSubItem: (optionId, serviceIndex, subItemIndex) =>
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? {
                  ...opt,
                  services: migrateServices(opt.services).map((s, i) =>
                    i === serviceIndex && s.subItems
                      ? {
                          ...s,
                          subItems: s.subItems.filter((_, si) => si !== subItemIndex),
                        }
                      : s
                  ),
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
