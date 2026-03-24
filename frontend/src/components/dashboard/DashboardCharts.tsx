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
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A pie chart with a legend"

const chartConfig = {
  schools: {
    label: "Schools",
  },
  basic: {
    label: "Basic",
    color: "var(--chart-1)",
  },
  premium: {
    label: "Premium",
    color: "var(--chart-2)",
  },
  business: {
    label: "Business",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

interface SubscriptionPieChartProps {
  basic: number;
  premium: number;
  business: number;
}

export function SubscriptionPieChart({ basic, premium, business }: SubscriptionPieChartProps) {
  const chartData = [
    { plan: "basic", schools: basic, fill: "var(--color-basic)" },
    { plan: "premium", schools: premium, fill: "var(--color-premium)" },
    { plan: "business", schools: business, fill: "var(--color-business)" },
  ]

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
              content={<ChartTooltipContent hideLabel />}
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
