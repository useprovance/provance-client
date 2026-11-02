import { Navigate, useParams, Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { DocsContent } from "@/components/docs/DocsContent";
import { DocsTopBar } from "@/components/docs/DocsTopBar";
import { getAllSlugs, getNavInfo, stripFrontmatter, formatDate } from "@/config/docs.config";

const docs = import.meta.glob("../../content/docs/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function getDoc(slug: string): string | null {
  const key = `../../content/docs/${slug}.md`;
  return docs[key] ?? null;
}

export default function DocSlugPage() {
  const { slug = "" } = useParams<{ slug: string }>();

  if (!getAllSlugs().includes(slug)) return <Navigate to="/docs/introduction" replace />;

  const raw = getDoc(slug);
  if (!raw) return <Navigate to="/docs/introduction" replace />;

  const { body, title, lastUpdated } = stripFrontmatter(raw);
  const { prev, next, section, current } = getNavInfo(slug);

  return (
    <div>
      <DocsTopBar
        sectionTitle={section?.section ?? "Docs"}
        pageTitle={current?.title ?? title ?? slug}
        content={body}
        slug={slug}
      />
      <div className="max-w-3xl px-4 md:px-12 pt-6 pb-14">
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
                to={`/docs/${prev.slug}`}
                className="flex items-center gap-2 text-[16px] text-white/70 hover:text-white transition-colors group"
              >
                <ChevronRight size={18} className="rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                {prev.title}
              </Link>
            ) : <div />}
            {next && (
              <Link
                to={`/docs/${next.slug}`}
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
