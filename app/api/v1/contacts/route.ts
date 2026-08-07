import { errorResponse, ok, parseJson } from "@/lib/api";
import { getCustomer } from "@/features/crm/services/domain-service";
import { requirePermission } from "@/features/auth/services/auth-service";
import { createContact } from "@/features/crm/services/domain-service";
import { contactSchema } from "@/features/crm/validation";
import { listHandler } from "@/features/crm/services/list-handler";

export async function GET(request: Request) {
  return listHandler(request, "contacts", "contacts");
}

export async function POST(request: Request) {
  try {
    const body = contactSchema.parse(await parseJson(request));
    const customer = await getCustomer(body.customerId);
    const user = await requirePermission("contacts", "create", customer.ownerId as string);
    return ok(await createContact(body, user.id));
  } catch (error) { return errorResponse(error); }
}
