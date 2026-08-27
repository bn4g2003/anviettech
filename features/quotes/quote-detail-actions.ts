import type { QuoteStatus } from "@/features/quotes/types";

export function getQuoteDetailAction(
  status: QuoteStatus,
  canApprove: boolean,
  canEdit: boolean,
) {
  if (status === "sent" && canApprove) return "approve";
  if (status === "draft" && canEdit) return "edit";
  return null;
}
