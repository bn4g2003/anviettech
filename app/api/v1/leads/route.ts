import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createLead } from "@/features/crm/services/domain-service";
import { leadCreateSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "leads", "leads");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = leadCreateSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "leads", "create", body.ownerId);
    return ok(await createLead({ ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
