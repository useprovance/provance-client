"use client";

import { PrivyProvider } from "@privy-io/react-auth";

let cachedToken: string | undefined;
let tokenExpiresAt = 0;

async function getPrivyToken(): Promise<string | undefined> {
   if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
   try {
      const res = await fetch("/api/auth/privy/token");
      if (!res.ok) return undefined;
      const data = await res.json() as { token?: string };
      cachedToken = data.token;
      tokenExpiresAt = Date.now() + 4 * 60 * 1000; // cache for 4 min (token is valid 5)
      return cachedToken;
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
               isLoading: false,
               getCustomAccessToken: getPrivyToken,
            },
         }}
      >
         {children}
      </PrivyProvider>
   );
}
