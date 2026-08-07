import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createTask } from "@/features/crm/services/domain-service";
import { assertActorCanAccessLinkedEntities } from "@/features/crm/services/relation-guards";
import { taskSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "tasks", "tasks");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = taskSchema.parse(await parseJson(request));
    await assertActorCanAccessLinkedEntities(user, body);
    const ownerId = await resolveOwnerForCreate(user, "tasks", "create", body.ownerId);
    return ok(await createTask({ ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
