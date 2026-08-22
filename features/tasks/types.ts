import type { EntityId, OwnerRef, Timestamps } from "@/features/shared/types/ids";

export type TaskType = "call" | "meeting" | "followup" | "email";
export type TaskStatus = "open" | "done" | "cancelled";

export const TASK_TYPE_LABEL: Record<string, string> = {
  call: "Gọi điện",
  meeting: "Họp",
  followup: "Follow-up",
  email: "Email",
  todo: "Công việc",
};

export type Task = Timestamps & {
  id: EntityId;
  title: string;
  type: TaskType;
  status: TaskStatus;
  dueAt: string;
  owner: OwnerRef;
  customerId?: EntityId;
  dealId?: EntityId;
  notes?: string;
};

export type TaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">;
