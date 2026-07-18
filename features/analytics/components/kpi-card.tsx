import Link from "next/link";
import { cn } from "@/lib/cn";

type KpiCardProps = {
  label: string;
  value: string;
  href?: string;
  hint?: string;
  tone?: "default" | "danger" | "success";
  className?: string;
};

export function KpiCard({
  label,
  value,
  href,
  hint,
  tone = "default",
  className,
}: KpiCardProps) {
  const content = (
    <>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums leading-tight",
          tone === "danger" && "text-danger",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted">{hint}</p> : null}
    </>
  );

  const base = cn(
    "rounded border border-border bg-white px-3 py-2.5 transition-colors",
    href && "hover:border-foreground/30 hover:bg-muted-bg/50",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  }

  return <div className={base}>{content}</div>;
}
