import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { getContract, updateContract } from "@/features/crm/services/domain-service";
import { contractSchema } from "@/features/crm/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contract = await getContract(id);
    await requirePermission("contracts", "view", contract.ownerId as string);
    return ok(contract);
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contract = await getContract(id);
    const user = await requirePermission("contracts", "update", contract.ownerId as string);
    const body = contractSchema.partial().parse(await parseJson(request));
    const ownerId = body.ownerId && body.ownerId !== contract.ownerId
      ? await resolveOwnerForCreate(user, "contracts", "update", body.ownerId)
      : body.ownerId;
    return ok(await updateContract(id, { ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
