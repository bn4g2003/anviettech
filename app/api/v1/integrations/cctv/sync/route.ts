import { errorResponse, ok, parseJson } from "@/lib/api";
import { requireBusinessUser, requirePermission } from "@/features/auth/services/auth-service";
import { permissionMatches } from "@/features/auth/services/permission-utils";
import {
  commitCctvSync,
  previewCctvSync,
  type SyncPreviewData,
} from "@/features/integrations/services/cctv-sync-service";
import { query } from "@/lib/db";
import { isCctvConfigured } from "@/lib/cctv-db";

export async function GET() {
  try {
    const user = await requireBusinessUser();
    const canView =
      permissionMatches(user, "integrations", "view").length > 0 ||
      permissionMatches(user, "integrations", "sync").length > 0;

    if (!canView) {
      return ok({ configured: isCctvConfigured(), canSync: false, lastSync: null });
    }

    const res = await query<{
      id: string;
      started_at: Date;
      completed_at: Date;
      status: string;
      customers_count: number;
      orders_count: number;
      error_message: string;
    }>(
      `SELECT id, started_at, completed_at, status, customers_count, orders_count, error_message
       FROM cctv_sync_logs
       ORDER BY started_at DESC
       LIMIT 1`,
    );

    return ok({
      configured: isCctvConfigured(),
      canSync: permissionMatches(user, "integrations", "sync").length > 0,
      lastSync: res.rows[0] ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("integrations", "sync");
    const body = (await parseJson(request).catch(() => ({}))) as { previewData?: SyncPreviewData };
    const preview = body?.previewData || (await previewCctvSync());
    const result = await commitCctvSync(preview, user.id);
    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
