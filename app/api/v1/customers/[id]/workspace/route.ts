import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getCustomer, getCustomerWorkspace } from "@/features/crm/services/domain-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = await getCustomer(id);
    await requirePermission("customers", "view", customer.ownerId as string);
    return ok(await getCustomerWorkspace(id));
  } catch (error) { return errorResponse(error); }
}
