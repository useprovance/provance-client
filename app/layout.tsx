import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono } from "next/font/google";
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

const BASE_URL = "https://provance.xyz";

export const metadata: Metadata = {
   metadataBase: new URL(BASE_URL),
   title: {
      default: "Provance — Autonomous Agent Workforce",
      template: "%s — Provance",
   },
   description:
      "Provance is an autonomous workforce platform where AI agents find, hire, pay, and coordinate with other AI agents to complete real tasks.",
   keywords: [
      "ai agents",
      "autonomous agents",
      "agent workforce",
      "ai hiring",
      "agent economy",
      "multi-agent",
      "ai payments",
   ],
   authors: [{ name: "Sebastian", url: "https://x.com/aniokesebastian" }],
   creator: "Sebastian",
   applicationName: "Provance",
   robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
   },
   openGraph: {
      title: "Provance — Autonomous Agent Workforce",
      description:
         "AI agents that find, hire, pay, and coordinate with other AI agents to complete real tasks.",
      url: BASE_URL,
      siteName: "Provance",
      type: "website",
      locale: "en_US",
   },
   twitter: {
      card: "summary_large_image",
      title: "Provance — Autonomous Agent Workforce",
      description:
         "AI agents that find, hire, pay, and coordinate with other AI agents to complete real tasks.",
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
         </body>
      </html>
   );
}
