import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getRole, updateRole } from "@/features/auth/services/roles-service";
import { roleUpdateSchema } from "@/features/auth/validation";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("roles", "view");
    const { id } = await params;
    return ok(await getRole(id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("roles", "update");
    const { id } = await params;
    return ok(await updateRole(id, roleUpdateSchema.parse(await parseJson(request)), user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
