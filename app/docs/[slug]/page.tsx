import { notFound } from "next/navigation";
import { readFile } from "fs/promises";
import path from "path";
import { DocsContent } from "@/components/docs/DocsContent";
import { DOC_NAV } from "@/components/docs/docs.config";
import { DocsTopBar } from "@/components/docs/DocsTopBar";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function getAllSlugs() {
  return DOC_NAV.flatMap((s) => s.items.map((i) => i.slug));
}

function getNavInfo(slug: string) {
  const all = DOC_NAV.flatMap((s) => s.items);
  const idx = all.findIndex((i) => i.slug === slug);
  const section = DOC_NAV.find((s) => s.items.some((i) => i.slug === slug));
  return {
    current: all[idx],
    section: section ?? null,
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

function stripFrontmatter(content: string): { body: string; title?: string; lastUpdated?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { body: content };
  const lines = match[1].split("\n");
  const titleLine = lines.find((l) => l.startsWith("title:"));
  const lastUpdatedLine = lines.find((l) => l.startsWith("lastUpdated:"));
  const title = titleLine?.replace("title:", "").trim();
  const lastUpdated = lastUpdatedLine?.replace("lastUpdated:", "").trim().replace(/"/g, "");
  // Strip the leading # h1 from body since we render it manually
  const body = match[2].trim().replace(/^#\s+.+\n?/, "").trim();
  return { body, title, lastUpdated };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getAllSlugs().includes(slug)) notFound();

  const filePath = path.join(process.cwd(), "content", "docs", `${slug}.md`);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch {
    notFound();
  }

  const { body, title, lastUpdated } = stripFrontmatter(raw);
  const { prev, next, section, current } = getNavInfo(slug);

  return (
    <div>
      <DocsTopBar
        sectionTitle={section?.section ?? "Docs"}
        pageTitle={current?.title ?? title ?? slug}
        content={body}
      />
    <div className="max-w-3xl px-12 pt-6 pb-14">
      <h1 className="text-[36px] font-semibold text-white mb-3 leading-tight">
        {current?.title ?? title ?? slug}
      </h1>
      {lastUpdated && (
        <p className="text-[13px] text-white/40 mb-8">Last updated {formatDate(lastUpdated)}</p>
      )}

      <DocsContent content={body} />

      {(prev ?? next) && (
        <div className="mt-16 pt-8 border-t border-sand-faint flex items-center justify-between">
          {prev ? (
            <Link
              href={`/docs/${prev.slug}`}
              className="flex items-center gap-2 text-[16px] text-white/70 hover:text-white transition-colors group"
            >
              <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
              {prev.title}
            </Link>
          ) : <div />}
          {next && (
            <Link
              href={`/docs/${next.slug}`}
              className="flex items-center gap-2 text-[16px] text-white/70 hover:text-white transition-colors group"
            >
              {next.title}
              <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
