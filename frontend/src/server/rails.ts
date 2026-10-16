export class RailsError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = "RailsError";
    this.status = status;
    this.body = body;
  }
}

export function apiOrigin(): string {
  const raw = process.env.API_URL ?? "http://127.0.0.1:3001";
  try {
    return new URL(raw).origin;
  } catch {
    throw new RailsError("Invalid API URL.", 500);
  }
}

export async function railsFetch(
  path: string,
  options: {
    method?: string;
    authorization: string;
    body?: unknown;
  },
): Promise<Response> {
  const headers = new Headers({ Accept: "application/json" });
  headers.set("Authorization", options.authorization);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  try {
    return await fetch(new URL(path, apiOrigin()), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new RailsError("Could not reach the server.", 502);
  }
}

export async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
