import { cn } from "@/lib/cn";

const colors: Record<string, string> = {
  yellow: "border-amber-400 text-amber-500",
  orange: "border-orange-400 text-orange-500",
  green: "border-green-500 text-green-600",
  red: "border-red-500 text-red-600",
  purple: "border-purple-500 text-purple-600",
  blue: "border-blue-500 text-blue-600",
  gray: "border-neutral-400 text-neutral-500",
};

type StatusDotProps = {
  color?: keyof typeof colors | string;
  label: string;
  className?: string;
};

export function StatusDot({ color = "gray", label, className }: StatusDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", className)}>
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 rounded-full border-2",
          colors[color] ?? colors.gray,
        )}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
