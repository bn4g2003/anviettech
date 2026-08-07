import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getContract } from "@/features/crm/services/domain-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contract = await getContract(id);
    await requirePermission("contracts", "view", contract.ownerId as string);
    return ok(contract);
  } catch (error) { return errorResponse(error); }
}
