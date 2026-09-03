import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createProject } from "@/features/crm/services/domain-service";
import { projectSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "projects", "projects");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = projectSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "projects", "create", body.ownerId);
    return ok(await createProject({ ...body, ownerId }, user.id));
  } catch (error) {
    return errorResponse(error);
  }
}
