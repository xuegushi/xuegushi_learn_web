import { create } from "zustand";

interface ApiErrorState {
  isOpen: boolean;
  message: string;
  title: string;
  showError: (title: string, message: string) => void;
  hideError: () => void;
}

export const useApiErrorStore = create<ApiErrorState>((set) => ({
  isOpen: false,
  message: "",
  title: "",
  showError: (title: string, message: string) =>
    set({ isOpen: true, title, message }),
  hideError: () => set({ isOpen: false, message: "", title: "" }),
}));
