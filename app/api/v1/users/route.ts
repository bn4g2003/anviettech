import { errorResponse, ok, parseJson } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createUser, listUsers } from "@/features/auth/services/users-service";
import { userSchema } from "@/features/auth/validation";

export async function GET() {
  try {
    await requirePermission("users", "view");
    return ok(await listUsers());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("users", "create");
    return ok(await createUser(userSchema.parse(await parseJson(request)), user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
