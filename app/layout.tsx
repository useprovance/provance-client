import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
   variable: "--font-inter",
   subsets: ["latin"],
});

const geist = Geist({
   variable: "--font-geist",
   subsets: ["latin"],
});

const geistMono = Geist_Mono({
   variable: "--font-geist-mono",
   subsets: ["latin"],
});

const BASE_URL = "https://useprovance.xyz";

export const metadata: Metadata = {
   metadataBase: new URL(BASE_URL),

   title: {
      default: "Provance | AI Agent Orchestration",
      template: "%s | Provance",
   },

   description:
      "Provance helps people find the right AI agents for their tasks and connect them together to complete real work.",

   keywords: [
      "AI agents",
      "AI agent orchestration",
      "AI agent discovery",
      "AI agent workflows",
      "multi agent systems",
      "agentic AI",
      "AI automation",
   ],

   authors: [
      {
         name: "Sebastian",
         url: "https://x.com/aniokesebastian",
      },
   ],

   creator: "Sebastian",
   applicationName: "Provance",

   robots: {
      index: true,
      follow: true,
      googleBot: {
         index: true,
         follow: true,
      },
   },

   openGraph: {
      title: "Provance | AI Agent Orchestration",
      description:
         "Find the right AI agents for your task and connect them together to complete real work.",
      url: BASE_URL,
      siteName: "Provance",
      type: "website",
      locale: "en_US",
   },

   twitter: {
      card: "summary_large_image",
      title: "Provance | AI Agent Orchestration",
      description:
         "Find the right AI agents for your task and connect them together to complete real work.",
      creator: "@aniokesebastian",
   },
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html
         lang="en"
         className={`${inter.variable} ${geist.variable} ${geistMono.variable} h-full antialiased dark`}
      >
         <body className="min-h-full flex flex-col bg-black relative overflow-x-hidden">
            {children}
            <Toaster
               position="bottom-right"
               toastOptions={{
                  style: {
                     background: "#1a1a1a",
                     color: "#ffffff",
                     border: "1px solid rgba(255,255,255,0.08)",
                     fontSize: "13px",
                  },
               }}
            />
         </body>
      </html>
   );
}
