import { errorResponse, ok, parseJson } from "@/lib/api";
import { adminSetupSchema } from "@/features/auth/validation";
import { bootstrapFirstAdmin, getAdminSetupStatus } from "@/features/auth/services/admin-setup-service";
import { login, setSessionCookie } from "@/features/auth/services/auth-service";

export async function GET() {
  try {
    return ok(await getAdminSetupStatus());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = adminSetupSchema.parse(await parseJson(request));
    await bootstrapFirstAdmin({
      fullName: input.fullName,
      email: input.email,
      password: input.password,
    });
    const token = await login(input.email, input.password, {
      ip: request.headers.get("x-forwarded-for")?.split(",")[0],
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await setSessionCookie(token);
    const status = await getAdminSetupStatus();
    return ok({ authenticated: true, cctvConfigured: status.cctvConfigured });
  } catch (error) {
    return errorResponse(error);
  }
}
