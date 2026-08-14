"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { type ReactNode } from "react";

export default function PrivyAuthProvider({ children }: { children: ReactNode }) {
   const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
   if (!appId) return <>{children}</>;

   return (
      <PrivyProvider
         appId={appId}
         config={{
            appearance: {
               theme: "dark",
               accentColor: "#d95e28",
            },
         }}
      >
         {children}
      </PrivyProvider>
   );
}
