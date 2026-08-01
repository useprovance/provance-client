"use client";

import { GitBranch, Bot, Zap, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const MONTHLY_RUNS = [
  { month: "January",   runs: 0    },
  { month: "February",  runs: 0    },
  { month: "March",     runs: 0    },
  { month: "April",     runs: 0    },
  { month: "May",       runs: 0    },
  { month: "June",      runs: 0    },
  { month: "July",      runs: 1696 },
  { month: "August",    runs: 0    },
  { month: "September", runs: 0    },
  { month: "October",   runs: 0    },
  { month: "November",  runs: 0    },
  { month: "December",  runs: 0    },
];

const chartConfig: ChartConfig = {
  runs: { label: "Runs", color: "#d95e28" },
};

const year = new Date().getFullYear();
const totalRuns = MONTHLY_RUNS.reduce((s, d) => s + d.runs, 0);

const STRIPE = {
  backgroundImage:
    "repeating-linear-gradient(-45deg, var(--sand) 0, var(--sand) 1px, transparent 0, transparent 50%)",
  backgroundSize: "6px 6px",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full bg-[#111] overflow-y-auto">
      <div className="max-w-5xl w-full mx-auto px-8 py-10 flex flex-col gap-8">

        {/* Badge strip */}
        <div className="flex items-center justify-between w-full border-t border-b border-sand/25 py-3">
          <div className="flex items-center gap-2 pr-6 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-orange shrink-0" />
            <p className="text-sand text-xs font-mono uppercase tracking-widest">Overview</p>
          </div>
          <div className="flex-1 h-full min-h-[16px]" style={{ ...STRIPE, opacity: 0.15 }} />
        </div>

        {/* Stats */}
        <div className="relative p-1.5 border border-sand/10">
          <div className="absolute inset-0 pointer-events-none" style={{ ...STRIPE, opacity: 0.25 }} />
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {[
              { label: "Total Workflows", display: "03", icon: GitBranch },
              { label: "Active Agents",   display: "08", icon: Bot       },
              { label: "Total Runs",      display: "1,696", icon: Zap    },
              { label: "Earned Total",    display: "4.89 USDC", icon: TrendingUp },
            ].map(({ label, display, icon: Icon }) => (
              <div key={label} className="flex flex-col justify-between bg-[#0f0f0f] border border-sand/20 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-sand/40">{label}</p>
                  <Icon size={15} strokeWidth={1.5} className="text-sand/70 shrink-0" />
                </div>
                <p className="text-[28px] font-bold text-sand leading-none font-mono">{display}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="relative p-1.5 border border-sand/10">
          <div className="absolute inset-0 pointer-events-none" style={{ ...STRIPE, opacity: 0.25 }} />
          <div className="relative z-10 bg-[#0f0f0f] border border-sand/20 p-5 flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-mono uppercase tracking-widest text-sand/40 mb-0.5">Workflow Runs</p>
              <p className="text-[11px] text-sand/25 font-mono">January – December {year}</p>
            </div>
            <ChartContainer config={chartConfig} className="h-[240px] w-full">
              <BarChart data={MONTHLY_RUNS} margin={{ top: 20, left: 8, right: 8 }}>
                <CartesianGrid stroke="rgba(227,216,197,0.06)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "rgba(227,216,197,0.3)", fontFamily: "monospace" }}
                  tickFormatter={(v) => v.slice(0, 3)}
                />
                <ChartTooltip
                  cursor={{ fill: "rgba(217,94,40,0.08)" }}
                  content={<ChartTooltipContent hideLabel className="bg-[#1c1c1c] border border-sand/20 text-sand" />}
                />
                <Bar dataKey="runs" fill="#d95e28" radius={[2, 2, 0, 0]}>
                  <LabelList
                    position="top"
                    offset={6}
                    fontSize={10}
                    fill="rgba(227,216,197,0.3)"
                    fontFamily="monospace"
                    formatter={(v: number) => (v === 0 ? "0" : v.toLocaleString())}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="border-t border-sand/10 pt-3 flex items-center gap-2 text-[11px] font-mono text-sand/35">
              <TrendingUp size={12} strokeWidth={1.5} className="text-emerald-400" />
              <span className="text-emerald-400">+23.1%</span>
              <span>increase this month · {totalRuns.toLocaleString()} total runs this year</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
