import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { postInventoryCount } from "@/features/crm/services/domain-service";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const user = await requirePermission("inventory", "approve"); return ok(await postInventoryCount(id, user.id)); } catch (error) { return errorResponse(error); } }
