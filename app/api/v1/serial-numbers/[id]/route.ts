import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getSerialNumber, updateSerialNumber } from "@/features/crm/services/domain-service";
import { serialNumberSchema } from "@/features/crm/validation";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; await requirePermission("inventory", "view"); return ok(await getSerialNumber(id)); } catch (error) { return errorResponse(error); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const user = await requirePermission("inventory", "update"); return ok(await updateSerialNumber(id, serialNumberSchema.partial().parse(await parseJson(request)), user.id)); } catch (error) { return errorResponse(error); } }
