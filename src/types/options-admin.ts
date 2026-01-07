// Types for the Options Services Administration

export interface ServiceOptionDefinition {
  id: string;
  title: string;
  subtitle?: string;
  services: string[];
  price?: {
    amount: number;
    unit: string;
  };
  isActive: boolean;
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
  
  // Prix
  setOptionPrice: (optionId: string, amount: number, unit: string) => void;
  removeOptionPrice: (optionId: string) => void;
  
  // Toggle
  toggleOptionActive: (optionId: string) => void;
}
