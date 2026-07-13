// Types for the Options Services Administration

// Structure hiérarchique pour les services avec sous-niveaux
export interface ServiceItem {
  text: string;           // Texte principal du service
  subItems?: string[];    // Sous-niveaux optionnels (précisions)
}

export interface ServiceOptionDefinition {
  id: string;
  title: string;
  subtitle?: string;
  services: ServiceItem[];  // Tableau d'objets ServiceItem
  price?: {
    amount: number;
    unit: string;
  };
  isActive: boolean;
  kind?: 'option' | 'pack';
  packServiceIds?: string[]; // Pour un pack : ids d'options regroupées
  erpReference?: string;     // Référence ERP (JAJA), admin uniquement
  createdAt: Date;
  updatedAt: Date;
}

export interface OptionsAdminState {
  options: ServiceOptionDefinition[];
  
  // CRUD
  addOption: (option: Omit<ServiceOptionDefinition, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOption: (id: string, updates: Partial<Omit<ServiceOptionDefinition, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteOption: (id: string) => void;
  
  // Services
  addServiceToOption: (optionId: string, service: string) => void;
  updateService: (optionId: string, serviceIndex: number, newValue: string) => void;
  removeService: (optionId: string, serviceIndex: number) => void;
  
  // Sous-items (précisions)
  addSubItemToService: (optionId: string, serviceIndex: number, subItem: string) => void;
  updateSubItem: (optionId: string, serviceIndex: number, subItemIndex: number, newValue: string) => void;
  removeSubItem: (optionId: string, serviceIndex: number, subItemIndex: number) => void;
  
  // Prix
  setOptionPrice: (optionId: string, amount: number, unit: string) => void;
  removeOptionPrice: (optionId: string) => void;
  
  // Toggle
  toggleOptionActive: (optionId: string) => void;
}
