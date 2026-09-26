import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getMarketingAnalyticsOverview } from "@/features/crm/services/domain-service";

export async function GET(request: Request) {
  try {
    await requirePermission("campaigns", "view");
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId") || undefined;
    const source = searchParams.get("source") || undefined;

    const data = await getMarketingAnalyticsOverview({ campaignId, source });
    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
