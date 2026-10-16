import { proxyJson } from "@/server/webhook";

export async function GET(request: Request) {
  return proxyJson(request, "/webhook_endpoints");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid request." }, { status: 400 });
  }

  return proxyJson(request, "/webhook_endpoints", { method: "POST", body });
}
