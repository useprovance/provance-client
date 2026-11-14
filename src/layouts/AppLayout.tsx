import { Outlet } from "react-router";
import AppSidebar from "@/components/shared/AppSidebar";
import NavigationProgress from "@/components/shared/NavigationProgress";

export default function AppLayout() {
   return (
      <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
         <NavigationProgress />
         <AppSidebar />
         <main className="flex-1 overflow-hidden flex flex-col min-w-0">
            <Outlet />
         </main>
      </div>
   );
}
