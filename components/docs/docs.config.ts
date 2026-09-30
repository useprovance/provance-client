export type DocNavItem = {
  title: string;
  slug: string;
};

export type DocNavSection = {
  section: string;
  items: DocNavItem[];
};

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
