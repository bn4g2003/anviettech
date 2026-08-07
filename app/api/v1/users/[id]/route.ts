import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { updateUser } from "@/features/auth/services/users-service";
import { userUpdateSchema } from "@/features/auth/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("users", "update");
    const { id } = await params;
    return ok(await updateUser(id, userUpdateSchema.parse(await parseJson(request)), user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
