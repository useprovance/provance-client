"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_NAV } from "./docs.config";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 flex flex-col sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto self-start">
      <nav className="flex-1 px-4 py-8 flex flex-col gap-7">
        {DOC_NAV.map((section) => (
          <div key={section.section}>
            <p className="text-[15px] font-semibold text-white px-2 mb-3">
              {section.section}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => {
                const active = pathname === `/docs/${item.slug}`;
                return (
                  <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    className={`px-2 py-2 text-[15px] transition-colors ${
                      active
                        ? "text-[#ff7a3d] pl-3"
                        : "text-white/50 hover:text-white pl-3"
                    }`}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

    </aside>
  );
}
