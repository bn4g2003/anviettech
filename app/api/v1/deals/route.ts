import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createDeal } from "@/features/crm/services/domain-service";
import { dealSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "deals", "deals");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = dealSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "deals", "create", body.ownerId);
    return ok(await createDeal({ ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
