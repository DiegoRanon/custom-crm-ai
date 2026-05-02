"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StageData = {
  stage: string;
  count: number;
  value: number;
};

type SourceData = {
  source: string;
  count: number;
  value: number;
};

type DashboardChartsProps = {
  stageData: StageData[];
  sourceData: SourceData[];
};

const chartColors = [
  "#0f172a",
  "#334155",
  "#475569",
  "#64748b",
  "#94a3b8",
  "#cbd5e1",
  "#e2e8f0",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardCharts({
  stageData,
  sourceData,
}: DashboardChartsProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Leads by Stage
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Number of leads currently in each pipeline stage.
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "value") {
                    return [formatCurrency(Number(value)), "Pipeline Value"];
                  }

                  return [value, "Leads"];
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {stageData.map((entry, index) => (
                  <Cell
                    key={entry.stage}
                    fill={chartColors[index % chartColors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Leads by Source
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Where your CRM leads are coming from.
          </p>
        </div>

        <div className="h-80">
          {sourceData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
              No lead source data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={105}
                  innerRadius={60}
                  paddingAngle={3}
                >
                  {sourceData.map((entry, index) => (
                    <Cell
                      key={entry.source}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name, props) => [
                    value,
                    props.payload.source,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {sourceData.map((item, index) => (
            <div
              key={item.source}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: chartColors[index % chartColors.length],
                  }}
                />
                <span className="text-slate-600">{item.source}</span>
              </div>

              <span className="font-semibold text-slate-900">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
