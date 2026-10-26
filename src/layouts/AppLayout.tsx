import { Outlet } from "react-router";
import AppHeader from "@/components/app/AppHeader";
import AppSidebar from "@/components/app/AppSidebar";

export default function AppLayout() {
   return (
      <div className="flex flex-col h-screen bg-[#141414] overflow-hidden">
         <AppHeader />
         <div className="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
               <Outlet />
            </main>
         </div>
      </div>
   );
}
