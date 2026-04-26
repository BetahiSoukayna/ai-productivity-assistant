import { create } from 'zustand';

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface AppState {
  user: User;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setUser: (user: User) => void;
}

export const useStore = create<AppState>((set) => ({
  user: {
    name: 'Jean Dupont',
    email: 'jean.dupont@exemple.com',
    avatar: 'https://picsum.photos/seed/user/100/100',
  },
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setUser: (user) => set({ user }),
}));
