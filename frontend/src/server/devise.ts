import type { FieldErrors } from "@/lib/auth-types";

const KNOWN_FIELDS = ["email", "password", "password_confirmation"] as const;

export class DeviseError extends Error {
  readonly status: number;
  readonly fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = "DeviseError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export type AuthResult = {
  email: string;
  token: string;
};

function apiOrigin(): string {
  const raw = process.env.API_URL ?? "http://127.0.0.1:3001";
  try {
    return new URL(raw).origin;
  } catch {
    throw new DeviseError("Invalid API URL.", 500);
  }
}

function bearerToken(response: Response): string | null {
  const header = response.headers.get("Authorization");
  const match = header?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function emailFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const user = (body as { user?: unknown }).user;
  if (!user || typeof user !== "object") return null;
  const email = (user as { email?: unknown }).email;
  return typeof email === "string" && email.length > 0 ? email : null;
}

function translateGeneral(message: string): string {
  if (message.toLowerCase() === "invalid email or password.") {
    return "Invalid email or password.";
  }
  return "Request failed.";
}

function translateField(field: string, message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("blank")) {
    if (field === "email") return "Enter your email.";
    if (field === "password") return "Enter your password.";
    if (field === "password_confirmation") return "Confirm your password.";
  }
  if (field === "email" && normalized.includes("invalid")) {
    return "Enter a valid email address.";
  }
  if (field === "email" && normalized.includes("taken")) {
    return "This email is already registered.";
  }
  if (field === "password" && normalized.includes("short")) {
    return "Password must be at least 6 characters.";
  }
  if (field === "password_confirmation" && normalized.includes("match")) {
    return "Passwords do not match.";
  }
  return message;
}

function parseFailure(status: number, body: unknown): DeviseError {
  const fieldErrors: FieldErrors = {};

  if (body && typeof body === "object") {
    const errors = (body as { errors?: unknown }).errors;
    if (errors && typeof errors === "object" && !Array.isArray(errors)) {
      for (const field of KNOWN_FIELDS) {
        const messages = (errors as Record<string, unknown>)[field];
        const first = Array.isArray(messages)
          ? messages.find((item) => typeof item === "string")
          : undefined;
        if (typeof first === "string") {
          fieldErrors[field] = translateField(field, first);
        }
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return new DeviseError("Please check the form fields.", status, fieldErrors);
  }

  const serverMessage =
    body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
      ? (body as { error: string }).error
      : "";

  if (status === 401) {
    return new DeviseError(translateGeneral(serverMessage || "Invalid Email or password."), 401);
  }

  if (status === 406) {
    return new DeviseError("Unsupported request format.", 406);
  }

  return new DeviseError(translateGeneral(serverMessage), status || 502);
}

async function deviseRequest(
  path: string,
  method: "POST" | "DELETE",
  body?: unknown,
  authorization?: string,
): Promise<Response> {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (authorization) {
    headers.set("Authorization", authorization);
  }

  try {
    return await fetch(new URL(path, apiOrigin()), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new DeviseError("Could not reach the server.", 502);
  }
}

async function authenticatedResult(
  response: Response,
  fallbackEmail?: string,
): Promise<AuthResult> {
  const body = await readJson(response);

  if (response.status !== 200 && response.status !== 201) {
    throw parseFailure(response.status, body);
  }

  const token = bearerToken(response);
  const email = emailFromBody(body) ?? fallbackEmail;

  if (!token) {
    throw new DeviseError("Server did not return an auth token.", 502);
  }
  if (!email) {
    throw new DeviseError("Incomplete response from server.", 502);
  }

  return { email, token };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const response = await deviseRequest("/users/sign_in", "POST", {
    user: { email, password },
  });
  return authenticatedResult(response, email);
}

export async function signUp(
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthResult> {
  const response = await deviseRequest("/users", "POST", {
    user: {
      email,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
  return authenticatedResult(response, email);
}

export async function signOut(authorization: string): Promise<void> {
  const response = await deviseRequest("/users/sign_out", "DELETE", undefined, authorization);
  await response.arrayBuffer();

  if (response.status === 204 || response.status === 200 || response.status === 401) {
    return;
  }

  throw new DeviseError("Could not sign out.", response.status || 502);
}

export function authResponse(body: unknown, status: number, token?: string): Response {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
  });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return new Response(JSON.stringify(body), { status, headers });
}

export function authErrorResponse(error: unknown): Response {
  if (error instanceof DeviseError) {
    return authResponse(
      { message: error.message, fieldErrors: error.fieldErrors },
      error.status || 502,
    );
  }

  console.error(error instanceof Error ? error.message : "Auth request failed");
  return authResponse({ message: "Request failed.", fieldErrors: {} }, 500);
}
