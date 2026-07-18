"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import { formatVnd } from "@/features/shared/utils/money";
import { Users } from "lucide-react";
import Link from "next/link";

export function AnalyticsTopCustomers() {
  const { topCustomers } = useAnalytics();

  return (
    <section className="rounded border border-border bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Top khách hàng</h2>
          <p className="text-xs text-muted">Theo doanh thu đã thu</p>
        </div>
        <Link
          href="/khach-hang"
          className="text-xs font-medium text-muted underline-offset-2 hover:underline"
        >
          Xem tất cả →
        </Link>
      </div>

      {topCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Chưa có doanh thu"
          description="Khi có hóa đơn đã thu, top KH sẽ hiện tại đây."
          className="py-8"
        />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-1.5 font-medium">#</th>
              <th className="pb-1.5 font-medium">Khách hàng</th>
              <th className="pb-1.5 text-right font-medium">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c, i) => (
              <tr key={c.customerId} className="border-b border-border/60 last:border-0">
                <td className="py-1.5 tabular-nums text-muted">{i + 1}</td>
                <td className="py-1.5">
                  <Link
                    href={`/khach-hang?id=${c.customerId}`}
                    className="font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {formatVnd(c.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
