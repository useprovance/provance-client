"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
   id: string;
   name: string;
   email: string | null;
   avatar_url: string | null;
   provider: string;
   onboarded: boolean;
};

type AuthStore = {
   user: AuthUser | null;
   setUser: (user: AuthUser) => void;
   clearUser: () => void;
};

export const useAuthStore = create<AuthStore>()(
   persist(
      (set) => ({
         user: null,
         setUser: (user) => set({ user }),
         clearUser: () => set({ user: null }),
      }),
      {
         name: "provance_user",
      }
   )
);
