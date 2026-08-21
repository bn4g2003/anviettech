"use client";

import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/ui/status-dot";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useDeals } from "@/features/deals/hooks/use-deals";
import { DEAL_STAGE_META, type Deal, type DealStage } from "@/features/deals/types";
import { useListPage } from "@/features/shared/hooks/use-list-page";
import { formatVnd } from "@/features/shared/utils/money";
import { useMemo } from "react";

const STAGES: DealStage[] = ["new", "demo", "negotiation", "ready", "won", "lost"];

export function DealsKanban() {
  const list = useListPage();
  const { getById: getCustomer } = useCustomers();
  const { rows, setStage } = useDeals({
    query: list.query,
    stage: (list.filters.stage as DealStage) || undefined,
    ownerId: list.filters.ownerId,
    customerId: list.filters.customerId,
  });

  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s, [] as Deal[]])) as Record<
      DealStage,
      Deal[]
    >;
    for (const d of rows) {
      map[d.stage]?.push(d);
    }
    return map;
  }, [rows]);

  return (
    <div className="min-h-0 flex-1 overflow-x-auto p-3">
      <div className="flex h-full min-h-[420px] gap-2">
        {STAGES.map((stage) => {
          const meta = DEAL_STAGE_META[stage] ?? { label: stage, color: "blue", probability: 0 };
          const cards = byStage[stage] ?? [];
          const total = cards.reduce((s, d) => s + (Number(d.value) || 0), 0);
          return (
            <div
              key={stage}
              className="flex w-56 shrink-0 flex-col rounded-md border border-border bg-muted-bg/40"
            >
              <div className="flex items-center justify-between gap-1 border-b border-border px-2 py-1.5">
                <StatusDot color={meta.color} label={meta.label} className="text-xs" />
                <span className="text-[10px] text-muted">{cards.length}</span>
              </div>
              <p className="border-b border-border px-2 py-1 text-[10px] text-muted">
                {formatVnd(total)}
              </p>
              <div className="flex-1 space-y-1.5 overflow-y-auto p-1.5">
                {cards.map((d) => {
                  const customer = d.customerId ? getCustomer(d.customerId) : null;
                  const currentIdx = STAGES.indexOf(d.stage);
                  const prevStage = currentIdx > 0 ? STAGES[currentIdx - 1] : undefined;
                  const nextStage = currentIdx >= 0 && currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : undefined;
                  const nextStages = [prevStage, nextStage].filter((s): s is DealStage => Boolean(s));
                  return (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      className="rounded border border-border bg-white p-2 text-xs shadow-sm hover:border-neutral-400"
                      onClick={() => list.setViewId(d.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") list.setViewId(d.id);
                      }}
                    >
                      <p className="font-medium leading-snug">{d.title}</p>
                      <p className="mt-0.5 text-muted">{customer?.name ?? "—"}</p>
                      <p className="mt-1 font-medium">{formatVnd(d.value)}</p>
                      <div
                        className="mt-1.5 flex flex-wrap gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {nextStages.map((s) => (
                          <Button
                            key={s}
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-[10px] text-muted"
                            onClick={() => setStage(d.id, s)}
                          >
                            → {DEAL_STAGE_META[s]?.label ?? s}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {cards.length === 0 ? (
                  <p className="px-1 py-4 text-center text-[10px] text-muted">Trống</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
