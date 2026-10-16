import { proxyJson } from "@/server/webhook";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  return proxyJson(request, `/webhook_endpoints/${id}/webhook_events`);
}
