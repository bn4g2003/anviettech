import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createCampaign } from "@/features/crm/services/domain-service";
import { campaignSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "campaigns", "campaigns");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = campaignSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "campaigns", "create", body.ownerId);
    return ok(await createCampaign({ ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
