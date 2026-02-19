import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServiceOptionDefinition, OptionsAdminState, ServiceItem } from '@/types/options-admin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const generateId = () => crypto.randomUUID();

// Helper pour convertir une string en ServiceItem
const toServiceItem = (text: string): ServiceItem => ({ text });

// Migration helper: convertir les anciens services (string[]) vers le nouveau format (ServiceItem[])
const migrateServices = (services: (string | ServiceItem)[]): ServiceItem[] => {
  return services.map(service =>
    typeof service === 'string' ? { text: service } : service
  );
};

// Convertit une row DB vers ServiceOptionDefinition
const dbRowToOption = (row: Record<string, unknown>): ServiceOptionDefinition => ({
  id: row.id as string,
  title: row.title as string,
  subtitle: (row.subtitle as string | null) ?? undefined,
  services: migrateServices((row.services as ServiceItem[]) || []),
  price: (row.price as { amount: number; unit: string } | null) ?? undefined,
  isActive: row.is_active as boolean,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

// Convertit un ServiceOptionDefinition vers un objet DB
const optionToDbRow = (option: ServiceOptionDefinition, sortOrder: number) => ({
  id: option.id,
  title: option.title,
  subtitle: option.subtitle ?? null,
  services: option.services as unknown as Record<string, unknown>[],
  price: option.price ?? null,
  is_active: option.isActive,
  sort_order: sortOrder,
});

// ─── Types pour le sync status ──────────────────────────────────────────────

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface OptionsAdminStateExtended extends OptionsAdminState {
  syncStatus: SyncStatus;
  isLoaded: boolean;
  setSyncStatus: (status: SyncStatus) => void;
  setOptions: (options: ServiceOptionDefinition[]) => void;
  ensureLoaded: () => Promise<void>;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useOptionsAdminStore = create<OptionsAdminStateExtended>()(
  persist(
    (set, get) => ({
      options: [],
      syncStatus: 'idle' as SyncStatus,
      isLoaded: false,

      setSyncStatus: (status) => set({ syncStatus: status }),

      setOptions: (options) => set({ options }),

      ensureLoaded: async () => {
        if (get().isLoaded) return;
        const dbOptions = await loadOptionsFromDB();
        if (dbOptions && dbOptions.length > 0) {
          set({ options: dbOptions, isLoaded: true });
        } else {
          set({ isLoaded: true });
        }
      },

      addOption: (option) => {
        const newOption: ServiceOptionDefinition = {
          ...option,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({ options: [...state.options, newOption] }));
        saveOptionToDB(newOption, get().options.length - 1 + 1, get().setSyncStatus);
      },

      updateOption: (id, updates) => {
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === id ? { ...opt, ...updates, updatedAt: new Date() } : opt
          ),
        }));
        const updated = get().options.find((o) => o.id === id);
        const idx = get().options.findIndex((o) => o.id === id);
        if (updated) saveOptionToDB(updated, idx, get().setSyncStatus);
      },

      deleteOption: (id) => {
        set((state) => ({ options: state.options.filter((opt) => opt.id !== id) }));
        deleteOptionFromDB(id, get().setSyncStatus);
      },

      addServiceToOption: (optionId, service) => {
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
        }));
        syncAfterMutation(optionId, get);
      },

      updateService: (optionId, serviceIndex, newValue) => {
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
        }));
        syncAfterMutation(optionId, get);
      },

      removeService: (optionId, serviceIndex) => {
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
        }));
        syncAfterMutation(optionId, get);
      },

      addSubItemToService: (optionId, serviceIndex, subItem) => {
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
        }));
        syncAfterMutation(optionId, get);
      },

      updateSubItem: (optionId, serviceIndex, subItemIndex, newValue) => {
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
        }));
        syncAfterMutation(optionId, get);
      },

      removeSubItem: (optionId, serviceIndex, subItemIndex) => {
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
        }));
        syncAfterMutation(optionId, get);
      },

      setOptionPrice: (optionId, amount, unit) => {
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? { ...opt, price: { amount, unit }, updatedAt: new Date() }
              : opt
          ),
        }));
        syncAfterMutation(optionId, get);
      },

      removeOptionPrice: (optionId) => {
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? { ...opt, price: undefined, updatedAt: new Date() }
              : opt
          ),
        }));
        syncAfterMutation(optionId, get);
      },

      toggleOptionActive: (optionId) => {
        set((state) => ({
          options: state.options.map((opt) =>
            opt.id === optionId
              ? { ...opt, isActive: !opt.isActive, updatedAt: new Date() }
              : opt
          ),
        }));
        syncAfterMutation(optionId, get);
      },
    }),
    {
      name: 'options-admin-storage',
    }
  )
);

// ─── Helpers de synchronisation DB ──────────────────────────────────────────

function syncAfterMutation(
  optionId: string,
  get: () => OptionsAdminStateExtended
) {
  const state = get();
  const option = state.options.find((o) => o.id === optionId);
  const idx = state.options.findIndex((o) => o.id === optionId);
  if (option) saveOptionToDB(option, idx, state.setSyncStatus);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

async function saveOptionToDB(
  option: ServiceOptionDefinition,
  sortOrder: number,
  setSyncStatus: (s: SyncStatus) => void
) {
  setSyncStatus('saving');
  try {
    const { error } = await db
      .from('options_services')
      .upsert(optionToDbRow(option, sortOrder), { onConflict: 'id' });

    if (error) throw error;
    setSyncStatus('saved');
    // Remet à "idle" après 2 secondes
    setTimeout(() => setSyncStatus('idle'), 2000);
  } catch (err) {
    console.error('[OptionsAdminStore] Erreur de sauvegarde:', err);
    setSyncStatus('error');
    toast.error('Erreur de sauvegarde des options. Vos modifications sont conservées localement.');
    setTimeout(() => setSyncStatus('idle'), 4000);
  }
}

async function deleteOptionFromDB(
  id: string,
  setSyncStatus: (s: SyncStatus) => void
) {
  setSyncStatus('saving');
  try {
    const { error } = await db
      .from('options_services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setSyncStatus('saved');
    setTimeout(() => setSyncStatus('idle'), 2000);
  } catch (err) {
    console.error('[OptionsAdminStore] Erreur de suppression:', err);
    setSyncStatus('error');
    toast.error('Erreur de suppression. Modification conservée localement.');
    setTimeout(() => setSyncStatus('idle'), 4000);
  }
}

// ─── Chargement depuis la DB ─────────────────────────────────────────────────

export async function loadOptionsFromDB(): Promise<ServiceOptionDefinition[] | null> {
  try {
    const { data, error } = await db
      .from('options_services')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[OptionsAdminStore] Erreur de chargement:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    return (data as Record<string, unknown>[]).map(dbRowToOption);
  } catch (err) {
    console.error('[OptionsAdminStore] Exception lors du chargement:', err);
    return null;
  }
}
