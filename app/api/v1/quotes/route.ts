import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, resolveOwnerForCreate } from "@/features/auth/services/auth-service";
import { createQuote } from "@/features/crm/services/domain-service";
import { quoteSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "quotes", "quotes");
}

export async function POST(request: Request) {
  try {
    const user = await requireBusinessUser();
    const body = quoteSchema.parse(await parseJson(request));
    const ownerId = await resolveOwnerForCreate(user, "quotes", "create", body.ownerId);
    return ok(await createQuote({ ...body, ownerId }, user.id));
  } catch (error) { return errorResponse(error); }
}
