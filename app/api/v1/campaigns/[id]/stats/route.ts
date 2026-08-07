import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getCampaign, getCampaignStats } from "@/features/crm/services/domain-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await getCampaign(id);
    await requirePermission("campaigns", "view", campaign.ownerId);
    return ok(await getCampaignStats(id));
  } catch (error) { return errorResponse(error); }
}
