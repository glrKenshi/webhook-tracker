import { authErrorResponse, authResponse, signIn } from "@/server/devise";

function readCredentials(payload: unknown): { email: string; password: string } | null {
  if (!payload || typeof payload !== "object") return null;

  const email = (payload as { email?: unknown }).email;
  const password = (payload as { password?: unknown }).password;

  if (typeof email !== "string" || typeof password !== "string") return null;

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) return null;

  return { email: trimmedEmail, password };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return authResponse({ message: "Invalid request.", fieldErrors: {} }, 400);
  }

  const credentials = readCredentials(payload);
  if (!credentials) {
    return authResponse({ message: "Enter email and password.", fieldErrors: {} }, 400);
  }

  try {
    const result = await signIn(credentials.email, credentials.password);
    return authResponse({ email: result.email }, 200, result.token);
  } catch (error) {
    return authErrorResponse(error);
  }
}
