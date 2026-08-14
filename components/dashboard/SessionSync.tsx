"use client";

import { useEffect } from "react";
import { useAuthStore, type AuthUser } from "@/stores/useAuthStore";

export default function SessionSync() {
   const user = useAuthStore((s) => s.user);
   const setUser = useAuthStore((s) => s.setUser);

   useEffect(() => {
      if (user) return;
      fetch("/api/auth/me")
         .then((r) => r.ok ? r.json() : null)
         .then((data: { user: AuthUser } | null) => {
            if (data?.user) setUser(data.user);
         })
         .catch(() => null);
   }, [user, setUser]);

   return null;
}
