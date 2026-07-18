import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type DealStage =
  | "new"
  | "demo"
  | "negotiation"
  | "ready"
  | "won"
  | "lost";

export const DEAL_STAGE_META: Record<
  DealStage,
  { label: string; color: string; probability: number }
> = {
  new: { label: "Mới", color: "blue", probability: 10 },
  demo: { label: "Demo/Triển khai", color: "orange", probability: 30 },
  negotiation: { label: "Đàm phán", color: "yellow", probability: 50 },
  ready: { label: "Sẵn sàng chốt", color: "purple", probability: 80 },
  won: { label: "Thắng", color: "green", probability: 100 },
  lost: { label: "Thua", color: "red", probability: 0 },
};

export type Deal = Timestamps & {
  id: EntityId;
  code: string;
  title: string;
  customerId: EntityId;
  stage: DealStage;
  value: number;
  probability: number;
  owner: OwnerRef;
  expectedCloseDate: string;
  productIds: EntityId[];
  notes?: string;
};

export type DealInput = Omit<Deal, "id" | "createdAt" | "updatedAt" | "code" | "probability"> & {
  code?: string;
  probability?: number;
};
