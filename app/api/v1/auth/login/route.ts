import { errorResponse, ok, parseJson } from "@/lib/api";
import { loginSchema } from "@/features/auth/validation";
import { login, setSessionCookie } from "@/features/auth/services/auth-service";

export async function POST(request: Request) { try { const input = loginSchema.parse(await parseJson(request)); const token = await login(input.email, input.password, { ip: request.headers.get("x-forwarded-for")?.split(",")[0], userAgent: request.headers.get("user-agent") ?? undefined }); await setSessionCookie(token); return ok({ authenticated: true }); } catch (error) { return errorResponse(error); } }
