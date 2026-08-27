import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { listHandler } from "@/features/crm/services/list-handler";
import { createContract } from "@/features/crm/services/domain-service";
import { contractSchema } from "@/features/crm/validation";
export async function GET(request: Request) {
  return listHandler(request, "contracts", "contracts");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = contractSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "contracts", "create", body.ownerId);
    return ok(await createContract({ ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
