import { apiOrigin, railsFetch, readJson, RailsError } from "@/server/rails";

export type EndpointRecord = {
  id: number;
  name: string;
  token: string;
  url: string;
  created_at: string;
};

function requireBearer(request: Request): string {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new RailsError("No session found.", 401);
  }
  return authorization;
}

function withUrl(raw: Record<string, unknown>): EndpointRecord {
  const token = typeof raw.token === "string" ? raw.token : "";
  return {
    id: Number(raw.id),
    name: typeof raw.name === "string" ? raw.name : "",
    token,
    url: `${apiOrigin()}/i/${token}`,
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
  };
}

export async function proxyJson(
  request: Request,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<Response> {
  try {
    const authorization = requireBearer(request);
    const response = await railsFetch(path, {
      method: options.method,
      authorization,
      body: options.body,
    });

    if (response.status === 204) {
      return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    }

    const data = await readJson(response);

    if (!response.ok) {
      return Response.json(
        { message: "Request failed.", errors: data },
        { status: response.status, headers: { "cache-control": "no-store" } },
      );
    }

    if (Array.isArray(data)) {
      return Response.json(
        data.map((item) => {
          if (item && typeof item === "object" && "token" in item) {
            return withUrl(item as Record<string, unknown>);
          }
          return item;
        }),
        { headers: { "cache-control": "no-store" } },
      );
    }

    if (data && typeof data === "object" && "token" in data) {
      return Response.json(withUrl(data as Record<string, unknown>), {
        status: response.status,
        headers: { "cache-control": "no-store" },
      });
    }

    return Response.json(data, {
      status: response.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    if (error instanceof RailsError) {
      return Response.json(
        { message: error.message },
        { status: error.status || 502, headers: { "cache-control": "no-store" } },
      );
    }
    console.error(error instanceof Error ? error.message : "Webhook proxy failed");
    return Response.json(
      { message: "Request failed." },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
