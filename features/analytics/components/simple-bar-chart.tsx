import { formatVnd } from "@/features/shared/utils/money";
import { cn } from "@/lib/cn";

export type BarItem = {
  id: string;
  label: string;
  value: number;
  secondary?: string;
};

type SimpleBarChartProps = {
  items: BarItem[];
  orientation?: "horizontal" | "vertical";
  formatValue?: (value: number) => string;
  className?: string;
  barClassName?: string;
  height?: number;
};

export function SimpleBarChart({
  items,
  orientation = "horizontal",
  formatValue = formatVnd,
  className,
  barClassName = "bg-foreground/80",
  height = 160,
}: SimpleBarChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (orientation === "vertical") {
    return (
      <div className={cn("flex items-end gap-2", className)} style={{ height }}>
        {items.map((item) => {
          const pct = Math.round((item.value / max) * 100);
          return (
            <div
              key={item.id}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
              title={`${item.label}: ${formatValue(item.value)}`}
            >
              <span className="truncate text-[10px] tabular-nums text-muted">
                {formatValue(item.value)}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                    className={cn("mx-auto w-[70%] rounded-t", barClassName)}
                  style={{ height: `${pct}%`, minHeight: item.value > 0 ? 4 : 0 }}
                />
              </div>
              <span className="w-full truncate text-center text-[10px] text-muted">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => {
        const pct = Math.round((item.value / max) * 100);
        return (
          <div key={item.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate font-medium">{item.label}</span>
              <span className="shrink-0 tabular-nums text-muted">
                {item.secondary ?? formatValue(item.value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted-bg">
              <div
                className={cn("h-full rounded-full", barClassName)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
