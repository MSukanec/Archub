import { create } from 'zustand';

export interface OnboardingData {
  // Step 1: Organization data
  organizationName: string;
  defaultCurrencyId: string;
  defaultWalletId: string;
  pdfTemplateId: string;
  avatarUrl: string;
  
  // Step 2: User profile data
  country: string;
  age: number | null;
  discoveredBy: string;
}

interface OnboardingStore {
  // Modal state
  isOpen: boolean;
  currentStep: number;
  isLoading: boolean;
  
  // Form data
  data: OnboardingData;
  
  // Actions
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: number) => void;
  updateData: (field: keyof OnboardingData, value: any) => void;
  setLoading: (loading: boolean) => void;
  resetData: () => void;
  nextStep: () => void;
  previousStep: () => void;
}

const initialData: OnboardingData = {
  organizationName: '',
  defaultCurrencyId: '',
  defaultWalletId: '',
  pdfTemplateId: '',
  avatarUrl: '',
  country: '',
  age: null,
  discoveredBy: ''
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  isOpen: false,
  currentStep: 1,
  isLoading: false,
  data: initialData,
  
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false, currentStep: 1 }),
  setStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  updateData: (field, value) => set((state) => ({
    data: { ...state.data, [field]: value }
  })),
  
  resetData: () => set({ data: initialData }),
  
  nextStep: () => set((state) => ({ 
    currentStep: Math.min(state.currentStep + 1, 3) 
  })),
  
  previousStep: () => set((state) => ({ 
    currentStep: Math.max(state.currentStep - 1, 1) 
  })),
}));