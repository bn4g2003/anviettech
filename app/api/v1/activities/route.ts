import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createActivity } from "@/features/crm/services/domain-service";
import { assertActorCanAccessLinkedEntities } from "@/features/crm/services/relation-guards";
import { activitySchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "activities", "activities");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = activitySchema.parse(await parseJson(request));
    await assertActorCanAccessLinkedEntities(user, body);
    await resolveOwnerForCreate(user, "activities", "create", user.id);
    return ok(await createActivity(body, user.id));
  } catch (error) { return errorResponse(error); }
}
