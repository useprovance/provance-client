"use client";

import { useState } from "react";
import { CheckCheck, ChevronDown, Copy } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  sectionTitle: string;
  pageTitle: string;
  content: string;
};

export function DocsTopBar({ sectionTitle, pageTitle, content }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between px-12 pt-8 pb-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-white/40 text-[14px]">{sectionTitle}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-white/20 [&>svg]:size-5" />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-white text-[14px]">{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center rounded-md overflow-hidden border border-white/10">
        <button
          onClick={() => void handleCopy()}
          className="flex items-center gap-2 px-4 py-2 text-[13px] text-white/70 hover:text-white hover:bg-white/5 transition-colors cursor-pointer border-r border-white/10"
        >
          {copied ? <CheckCheck size={13} strokeWidth={2} className="text-white" /> : <Copy size={13} strokeWidth={1.5} />}
          {copied ? "Copied!" : "Copy page"}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
              <ChevronDown size={14} strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={16}
            className="bg-[#1a1a1a] ring-0 border border-white/10 rounded-md shadow-xl min-w-[240px] p-1"
          >
            <DropdownMenuItem
              onClick={() => void handleCopy()}
              className="flex flex-col items-start gap-1 px-3 py-2.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img src="/icons/markdown.svg" alt="" className="w-5 h-5 shrink-0 opacity-100 invert" />
                <span className="text-[13px] font-medium text-white">View as Markdown</span>
              </div>
              <span className="text-[13px] text-white/40">Open this page in Markdown</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
