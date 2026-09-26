"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Deal, DealStage } from "@/features/deals/types";
import { DealWinLossDialog } from "./deal-win-loss-dialog";
import { useDeals } from "@/features/deals/hooks/use-deals";

type WinLossContextType = {
  openWinLoss: (deal: Deal, stage: "won" | "lost") => void;
};

const WinLossContext = createContext<WinLossContextType | null>(null);

export function WinLossProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<{ deal: Deal; stage: "won" | "lost" } | null>(null);
  const { setStage, update, reload } = useDeals();

  return (
    <WinLossContext.Provider
      value={{
        openWinLoss: (deal, stage) => setTarget({ deal, stage }),
      }}
    >
      {children}
      <DealWinLossDialog
        deal={target?.deal ?? null}
        targetStage={target?.stage ?? null}
        open={!!target}
        onOpenChange={(v) => !v && setTarget(null)}
        onConfirm={async (dealId, stage, reason, actualValue) => {
          await setStage(dealId, stage, reason);
          if (typeof actualValue === "number" && !isNaN(actualValue)) {
            await update(dealId, { value: actualValue });
          }
          await reload();
        }}
      />
    </WinLossContext.Provider>
  );
}

export function useWinLoss() {
  const ctx = useContext(WinLossContext);
  return ctx;
}
