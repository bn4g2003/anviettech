import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getCampaign, updateCampaign } from "@/features/crm/services/domain-service";
import { campaignSchema } from "@/features/crm/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await getCampaign(id);
    const user = await requirePermission("campaigns", "update", campaign.ownerId);
    const body = campaignSchema.partial().parse(await parseJson(request));
    let ownerId = body.ownerId;
    if (ownerId && ownerId !== campaign.ownerId) {
      ownerId = await resolveOwnerForCreate(user, "campaigns", "update", ownerId);
    }
    return ok(await updateCampaign(id, { ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
