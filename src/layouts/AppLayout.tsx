import { Outlet } from "react-router";
import AppHeader from "@/components/shared/AppHeader";
import AppSidebar from "@/components/shared/AppSidebar";
import NavigationProgress from "@/components/shared/NavigationProgress";

export default function AppLayout() {
   return (
      <div className="flex flex-col h-screen bg-[#141414] overflow-hidden">
         <NavigationProgress />
         <AppHeader />
         <div className="flex flex-1 overflow-hidden">
            <AppSidebar />
            <main className="flex-1 overflow-hidden flex flex-col min-w-0">
               <Outlet />
            </main>
         </div>
      </div>
   );
}
