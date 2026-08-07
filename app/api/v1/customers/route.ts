import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createCustomer } from "@/features/crm/services/crm-service";
import { customerSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "customers", "customers");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = customerSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "customers", "create", body.ownerId);
    return ok(await createCustomer({ ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
