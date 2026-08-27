import { ApiError, errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getQuote } from "@/features/crm/services/domain-service";
import { canApproveQuoteByRole } from "@/features/quotes/quote-approval-policy";
import { approveQuote } from "@/features/sales/services/sales-workflow-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    const user = await requirePermission("quotes", "approve", quote.ownerId as string);
    if (!canApproveQuoteByRole(user.roles)) {
      throw new ApiError(403, "Chỉ Admin hoặc Trưởng kinh doanh được duyệt báo giá");
    }
    return ok(await approveQuote(id, user.id));
  } catch (error) { return errorResponse(error); }
}
