import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart"

const chartConfig = {
  basic: {
    label: "Basic",
    color: "#64748b",
  },
  premium: {
    label: "Premium",
    color: "#4A9FD4",
  },
  business: {
    label: "Business",
    color: "#1E3A5F",
  },
} satisfies ChartConfig

interface SubscriptionPieChartProps {
  basic: number;
  premium: number;
  business: number;
}

interface TooltipPayload {
  payload: {
    plan: string;
    schools: number;
    fill: string;
    total: number;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  if (!data) return null;

  const total = data.total || 1;
  const percentage = ((data.schools / total) * 100).toFixed(1);

  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-xl border border-slate-100">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        {chartConfig[data.plan as keyof typeof chartConfig]?.label || data.plan}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-lg font-black text-slate-800">{data.schools}</span>
        <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
          {percentage}%
        </span>
      </div>
    </div>
  );
}

export function SubscriptionPieChart({ basic, premium, business }: SubscriptionPieChartProps) {
  const total = basic + premium + business;
  
  const chartData = [
    { plan: "basic", schools: basic, fill: chartConfig.basic.color, total },
    { plan: "premium", schools: premium, fill: chartConfig.premium.color, total },
    { plan: "business", schools: business, fill: chartConfig.business.color, total },
  ]

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-slate-300 text-xs font-bold uppercase tracking-widest">
        No schools data
      </div>
    );
  }

  return (
    <Card className="flex flex-col border-none shadow-none p-0">
      <CardHeader className="items-center pb-0 sr-only">
        <CardTitle>Subscription Distribution</CardTitle>
        <CardDescription>Breakdown by plan types</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<CustomTooltip />}
            />
            <Pie
              data={chartData}
              dataKey="schools"
              nameKey="plan"
              innerRadius={60}
            />
            <ChartLegend
              content={<ChartLegendContent nameKey="plan" />}
              className="-translate-y-2 flex-wrap gap-2 [&>*]:justify-center"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
