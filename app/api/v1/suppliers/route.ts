import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createSupplier } from "@/features/crm/services/domain-service";
import { supplierSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "suppliers", "suppliers");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = supplierSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "suppliers", "create", body.ownerId);
    return ok(await createSupplier({ ...body, ownerId }, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
