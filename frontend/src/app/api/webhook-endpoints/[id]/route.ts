import { proxyJson } from "@/server/webhook";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  return proxyJson(request, `/webhook_endpoints/${id}`);
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  return proxyJson(request, `/webhook_endpoints/${id}`, { method: "DELETE" });
}
