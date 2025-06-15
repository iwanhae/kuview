"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { ResourceData } from "./pod-resource-usage";
import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

interface ResourceRadialChartProps {
  title: string;
  capacity: number;
  data: ResourceData[];
  chartConfig: ChartConfig;
  formatValue: (value: number) => string;
}

export function ResourceRadialChart({
  title,
  capacity: nodeCapacity,
  data,
  chartConfig,
  formatValue,
}: ResourceRadialChartProps) {
  const sortedData = [...data];

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>Capacity: {formatValue(nodeCapacity)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[200px]"
        >
          <RadialBarChart
            data={sortedData}
            innerRadius={30}
            outerRadius={110}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="type"
                  formatter={(_value, _name, props) => {
                    const { value: originalValue, type } = props.payload;
                    return [
                      `${formatValue(originalValue)} (${(
                        (originalValue / nodeCapacity) *
                        100
                      ).toFixed(1)}%)`,
                      chartConfig[type as keyof typeof chartConfig]?.label ||
                        type,
                    ];
                  }}
                />
              }
            />
            <RadialBar dataKey="percentage" background />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm mt-auto">
        <div className="w-full mt-2 space-y-1">
          {sortedData.map((item) => (
            <div
              key={item.type}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="capitalize">
                  {chartConfig[item.type as keyof typeof chartConfig]?.label ||
                    item.type}
                </span>
              </div>
              <span>
                {formatValue(item.value)} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
