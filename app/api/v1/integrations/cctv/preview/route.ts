import { errorResponse, ok } from "@/lib/api";
import { requirePermission } from "@/features/auth/services/auth-service";
import { previewCctvSync } from "@/features/integrations/services/cctv-sync-service";

export async function GET() {
  try {
    await requirePermission("integrations", "sync");
    const previewData = await previewCctvSync();
    return ok(previewData);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST() {
  return GET();
}

