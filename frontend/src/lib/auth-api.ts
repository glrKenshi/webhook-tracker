import type { FieldErrors } from "@/lib/auth-types";

export type { FieldErrors };

export class AuthApiError extends Error {
  readonly fieldErrors: FieldErrors;

  constructor(message: string, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "AuthApiError";
    this.fieldErrors = fieldErrors;
  }
}

type AuthSuccess = {
  email: string;
  token: string;
};

function bearerToken(response: Response): string | null {
  const header = response.headers.get("Authorization");
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

async function errorFromResponse(response: Response): Promise<AuthApiError> {
  try {
    const body = (await response.json()) as { message?: unknown; fieldErrors?: unknown };
    const message =
      typeof body.message === "string" ? body.message : "Request failed.";
    const fieldErrors =
      body.fieldErrors && typeof body.fieldErrors === "object"
        ? (body.fieldErrors as FieldErrors)
        : {};
    return new AuthApiError(message, fieldErrors);
  } catch {
    return new AuthApiError("Request failed.");
  }
}

async function postAuth(path: string, body: unknown): Promise<AuthSuccess> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError("Could not reach the server.");
  }

  if (!response.ok) {
    throw await errorFromResponse(response);
  }

  const token = bearerToken(response);
  const payload = (await response.json()) as { email?: unknown };

  if (!token || typeof payload.email !== "string") {
    throw new AuthApiError("Incomplete response from server.");
  }

  return { email: payload.email, token };
}

export function requestSignIn(email: string, password: string): Promise<AuthSuccess> {
  return postAuth("/api/auth/sign-in", { email, password });
}

export function requestSignUp(
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthSuccess> {
  return postAuth("/api/auth/sign-up", { email, password, passwordConfirmation });
}

export async function requestSignOut(token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/api/auth/sign-out", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new AuthApiError("Could not reach the server.");
  }

  if (response.status === 204 || response.status === 200 || response.status === 401) return;
  if (!response.ok) throw await errorFromResponse(response);
}
