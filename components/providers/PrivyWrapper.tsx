"use client";

import { PrivyProvider } from "@privy-io/react-auth";

async function getPrivyToken(): Promise<string | undefined> {
   try {
      const res = await fetch("/api/auth/privy/token");
      if (!res.ok) return undefined;
      const data = await res.json() as { token?: string };
      return data.token;
   } catch {
      return undefined;
   }
}

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
   return (
      <PrivyProvider
         appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
         config={{
            customAuth: {
               getCustomAccessToken: getPrivyToken,
            },
         }}
      >
         {children}
      </PrivyProvider>
   );
}
