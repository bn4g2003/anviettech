import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { setUserStatus } from "@/features/auth/services/users-service";
import { userStatusSchema } from "@/features/auth/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("users", "update");
    const { id } = await params;
    const body = userStatusSchema.parse(await parseJson(request));
    await setUserStatus(id, body.status, user.id);
    return ok({ id, status: body.status });
  } catch (error) {
    return errorResponse(error);
  }
}
