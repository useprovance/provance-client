import { Outlet } from "react-router";
import Header from "@/components/landing-page/Header";
import Hero from "@/components/landing-page/Hero";
import Overview from "@/components/landing-page/Overview";
import Features from "@/components/landing-page/Features";
import Faq from "@/components/landing-page/Faq";
import Waitlist from "@/components/landing-page/Waitlist";
import Footer from "@/components/landing-page/Footer";

export default function LandingPage() {
   return (
      <>
         <main className="bg-ink">
            <Header />
            <div className="max-w-7xl mx-auto border-x border-sand-mid/10 flex flex-col gap-[5rem]">
               <Hero />
               <Overview />
               <Features />
               <Faq />
               <Waitlist />
               <Footer />
            </div>
         </main>
         <Outlet />
      </>
   );
}
