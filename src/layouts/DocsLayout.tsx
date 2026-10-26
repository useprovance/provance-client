import { Outlet } from "react-router";
import Header from "@/components/landing-page/Header";
import Footer from "@/components/landing-page/Footer";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

export default function DocsLayout() {
  return (
    <div className="min-h-screen bg-ink-dark flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0 max-w-7xl mx-auto w-full border-x border-sand-faint">
        <DocsSidebar />
        <main className="flex-1 min-w-0 border-l border-sand-faint">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}
