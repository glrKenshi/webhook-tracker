import { clearSession, getSessionSnapshot } from "@/lib/session";
import type { WebhookEndpoint, WebhookEvent } from "@/lib/webhook-types";

export class WebhookApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "WebhookApiError";
    this.status = status;
  }
}

async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const session = getSessionSnapshot().session;
  if (!session) {
    throw new WebhookApiError("No active session.", 401);
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new WebhookApiError("Could not reach the server.", 502);
  }

  if (response.status === 401) {
    clearSession();
    throw new WebhookApiError("Session expired. Please sign in again.", 401);
  }

  return response;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown; errors?: unknown };
    if (typeof body.message === "string") return body.message;
    if (body.errors && typeof body.errors === "object") {
      const first = Object.values(body.errors as Record<string, unknown>).flat()[0];
      if (typeof first === "string") return first;
    }
  } catch {
    // ignore
  }
  return "Request failed.";
}

export async function listEndpoints(): Promise<WebhookEndpoint[]> {
  const response = await api("/api/webhook-endpoints");
  if (!response.ok) throw new WebhookApiError(await errorMessage(response), response.status);
  return (await response.json()) as WebhookEndpoint[];
}

export async function createEndpoint(name: string): Promise<WebhookEndpoint> {
  const response = await api("/api/webhook-endpoints", {
    method: "POST",
    body: JSON.stringify({ webhook_endpoint: { name } }),
  });
  if (!response.ok) throw new WebhookApiError(await errorMessage(response), response.status);
  return (await response.json()) as WebhookEndpoint;
}

export async function getEndpoint(id: number): Promise<WebhookEndpoint> {
  const response = await api(`/api/webhook-endpoints/${id}`);
  if (!response.ok) throw new WebhookApiError(await errorMessage(response), response.status);
  return (await response.json()) as WebhookEndpoint;
}

export async function deleteEndpoint(id: number): Promise<void> {
  const response = await api(`/api/webhook-endpoints/${id}`, { method: "DELETE" });
  if (response.status === 204) return;
  if (!response.ok) throw new WebhookApiError(await errorMessage(response), response.status);
}

export async function listEvents(endpointId: number): Promise<WebhookEvent[]> {
  const response = await api(`/api/webhook-endpoints/${endpointId}/events`);
  if (!response.ok) throw new WebhookApiError(await errorMessage(response), response.status);
  return (await response.json()) as WebhookEvent[];
}

export async function getEvent(id: number): Promise<WebhookEvent> {
  const response = await api(`/api/webhook-events/${id}`);
  if (!response.ok) throw new WebhookApiError(await errorMessage(response), response.status);
  return (await response.json()) as WebhookEvent;
}

export type EventWithEndpoint = WebhookEvent & {
  endpoint: WebhookEndpoint;
};

/** Aggregate events across all user endpoints (no global events API exists). */
export async function listAllEvents(): Promise<{
  endpoints: WebhookEndpoint[];
  events: EventWithEndpoint[];
}> {
  const endpoints = await listEndpoints();
  const nested = await Promise.all(
    endpoints.map(async (endpoint) => {
      const events = await listEvents(endpoint.id);
      return events.map((event) => ({ ...event, endpoint }));
    }),
  );
  const events = nested
    .flat()
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  return { endpoints, events };
}
