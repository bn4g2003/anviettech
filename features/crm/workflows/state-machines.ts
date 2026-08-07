import { ApiError } from "../../../lib/api";

export type DealStage = "new" | "demo" | "negotiation" | "ready" | "won" | "lost";
export type TaskStatus = "open" | "done" | "cancelled";

const DEAL_TRANSITIONS: Record<DealStage, DealStage[]> = {
  new: ["demo", "negotiation", "lost"],
  demo: ["negotiation", "ready", "lost"],
  negotiation: ["ready", "won", "lost"],
  ready: ["won", "lost"],
  won: [],
  lost: [],
};

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  open: ["done", "cancelled"],
  done: [],
  cancelled: [],
};

export function assertDealStageTransition(from: string, to: string) {
  const allowed = DEAL_TRANSITIONS[from as DealStage];
  if (!allowed) throw new ApiError(422, `Giai đoạn hiện tại không hợp lệ: ${from}`);
  if (from === to) return;
  if (!allowed.includes(to as DealStage)) {
    if (from === "won" || from === "lost") {
      throw new ApiError(422, "Không thể mở lại cơ hội đã đóng");
    }
    throw new ApiError(422, `Không thể chuyển từ "${from}" sang "${to}"`);
  }
}

/** Reopen (done/cancelled → open) chỉ khi canReopen (scope all). */
export function assertTaskStatusTransition(from: string, to: string, canReopen = false) {
  if (from === to) return;
  if (canReopen && (from === "done" || from === "cancelled") && to === "open") return;
  const allowed = TASK_TRANSITIONS[from as TaskStatus];
  if (!allowed) throw new ApiError(422, `Trạng thái công việc không hợp lệ: ${from}`);
  if (!allowed.includes(to as TaskStatus)) {
    throw new ApiError(422, `Không thể chuyển công việc từ "${from}" sang "${to}"`);
  }
}

export function canTransitionDeal(from: DealStage, to: DealStage) {
  return from === to || (DEAL_TRANSITIONS[from] ?? []).includes(to);
}

export function canTransitionTask(from: TaskStatus, to: TaskStatus, canReopen = false) {
  if (from === to) return true;
  if (canReopen && (from === "done" || from === "cancelled") && to === "open") return true;
  return (TASK_TRANSITIONS[from] ?? []).includes(to);
}
