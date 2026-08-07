import { describe, expect, it } from "vitest";
import {
  assertDealStageTransition,
  assertTaskStatusTransition,
  canTransitionDeal,
  canTransitionTask,
} from "./state-machines";
import { ApiError } from "../../../lib/api";

describe("deal stage transitions", () => {
  it("allows forward pipeline moves", () => {
    expect(canTransitionDeal("new", "demo")).toBe(true);
    expect(canTransitionDeal("demo", "negotiation")).toBe(true);
    expect(canTransitionDeal("negotiation", "won")).toBe(true);
    expect(canTransitionDeal("ready", "lost")).toBe(true);
  });

  it("blocks reopen of closed deals", () => {
    expect(canTransitionDeal("won", "new")).toBe(false);
    expect(canTransitionDeal("lost", "negotiation")).toBe(false);
    expect(() => assertDealStageTransition("won", "new")).toThrow(ApiError);
  });

  it("blocks skipping backward or invalid jumps", () => {
    expect(() => assertDealStageTransition("new", "ready")).toThrow(ApiError);
    expect(() => assertDealStageTransition("demo", "won")).toThrow(ApiError);
  });
});

describe("task status transitions", () => {
  it("allows open to done or cancelled", () => {
    expect(canTransitionTask("open", "done")).toBe(true);
    expect(canTransitionTask("open", "cancelled")).toBe(true);
  });

  it("blocks reopen without elevated permission", () => {
    expect(canTransitionTask("done", "open")).toBe(false);
    expect(() => assertTaskStatusTransition("done", "open")).toThrow(ApiError);
  });

  it("allows reopen when canReopen is true", () => {
    expect(canTransitionTask("done", "open", true)).toBe(true);
    expect(() => assertTaskStatusTransition("cancelled", "open", true)).not.toThrow();
  });
});
