export type DocNavItem = { title: string; slug: string };
export type DocNavSection = { section: string; items: DocNavItem[] };

export const DOC_NAV: DocNavSection[] = [
  {
    section: "Getting Started",
    items: [
      { title: "Introduction", slug: "introduction" },
    ],
  },
  {
    section: "Core Concepts",
    items: [
      { title: "Agents", slug: "agents" },
      { title: "Workflows", slug: "workflows" },
      { title: "Payments", slug: "payments" },
    ],
  },
];

export function getAllSlugs() {
  return DOC_NAV.flatMap((s) => s.items.map((i) => i.slug));
}

export function getNavInfo(slug: string) {
  const all = DOC_NAV.flatMap((s) => s.items);
  const idx = all.findIndex((i) => i.slug === slug);
  const section = DOC_NAV.find((s) => s.items.some((i) => i.slug === slug));
  return {
    current: all[idx] ?? null,
    section: section ?? null,
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export function stripFrontmatter(content: string): { body: string; title?: string; lastUpdated?: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { body: content };
  const lines = match[1].split("\n");
  const title = lines.find((l) => l.startsWith("title:"))?.replace("title:", "").trim();
  const lastUpdated = lines.find((l) => l.startsWith("lastUpdated:"))?.replace("lastUpdated:", "").trim().replace(/"/g, "");
  const body = match[2].trim().replace(/^#\s+.+\n?/, "").trim();
  return { body, title, lastUpdated };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
