import { create } from "zustand";
import { getAllFromDB, setToDB, STORES } from "@/lib/db";

export interface User {
  id: number;
  user_name: string;
}

interface UserState {
  currentUser: { user_id: number; user_name: string } | null;
  users: User[];
  isLoading: boolean;
  initialize: () => Promise<void>;
  setCurrentUser: (user: { user_id: number; user_name: string } | null) => void;
  addUser: (userName: string) => Promise<User | null>;
  switchUser: (user: User) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  users: [],
  isLoading: true,

  initialize: async () => {
    try {
      const users = await getAllFromDB<User>(STORES.USERS);
      set({ users, isLoading: false });

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const user = JSON.parse(stored);
            if (users.some((u) => u.id === user.user_id)) {
              set({ currentUser: user });
            } else {
              localStorage.removeItem("user");
            }
          } catch {
            localStorage.removeItem("user");
          }
        }
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        localStorage.removeItem("user");
      }
    }
  },

  addUser: async (userName: string) => {
    const now = new Date().toISOString();
    await setToDB(STORES.USERS, { user_name: userName, created_at: now, updated_at: now });
    const users = await getAllFromDB<User>(STORES.USERS);
    const newUser = users[users.length - 1];
    set({ users });
    return newUser || null;
  },

  switchUser: async (user: User) => {
    const userData = { user_id: user.id, user_name: user.user_name };
    get().setCurrentUser(userData);
  },
}));
