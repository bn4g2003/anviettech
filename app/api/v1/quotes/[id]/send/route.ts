import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { getQuote, sendQuote } from "@/features/crm/services/domain-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    const user = await requirePermission("quotes", "update", quote.ownerId as string);
    return ok(await sendQuote(id, user.id));
  } catch (error) { return errorResponse(error); }
}
