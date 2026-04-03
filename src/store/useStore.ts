import { create } from 'zustand';

interface AppState {
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));
