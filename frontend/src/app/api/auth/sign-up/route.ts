import { authErrorResponse, authResponse, signUp } from "@/server/devise";

function readRegistration(
  payload: unknown,
): { email: string; password: string; passwordConfirmation: string } | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as {
    email?: unknown;
    password?: unknown;
    passwordConfirmation?: unknown;
  };

  if (
    typeof record.email !== "string" ||
    typeof record.password !== "string" ||
    typeof record.passwordConfirmation !== "string"
  ) {
    return null;
  }

  const email = record.email.trim();
  if (!email || !record.password || !record.passwordConfirmation) return null;

  return {
    email,
    password: record.password,
    passwordConfirmation: record.passwordConfirmation,
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return authResponse({ message: "Invalid request.", fieldErrors: {} }, 400);
  }

  const registration = readRegistration(payload);
  if (!registration) {
    return authResponse({ message: "Fill in all fields.", fieldErrors: {} }, 400);
  }

  try {
    const result = await signUp(
      registration.email,
      registration.password,
      registration.passwordConfirmation,
    );
    return authResponse({ email: result.email }, 200, result.token);
  } catch (error) {
    return authErrorResponse(error);
  }
}
