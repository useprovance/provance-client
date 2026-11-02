import { useState } from "react";
import { Outlet } from "react-router";
import { Menu, X } from "lucide-react";
import Header from "@/components/landing-page/Header";
import Footer from "@/components/landing-page/Footer";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export default function DocsLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-dark flex flex-col">
      <Header />

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-sand-faint sticky top-[72px] z-30 bg-ink-dark">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 text-white/60 hover:text-white transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="text-[14px] text-white/50">Docs</span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-72 bg-ink-dark border-r border-sand-faint flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-sand-faint">
              <span className="text-[14px] font-semibold text-white">Docs</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-white/60 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <DocsSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0 max-w-7xl mx-auto w-full border-x border-sand-faint">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <DocsSidebar />
        </div>
        <main className="flex-1 min-w-0 md:border-l border-sand-faint">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
