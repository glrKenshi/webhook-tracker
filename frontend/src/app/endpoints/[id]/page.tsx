import type { Metadata } from "next";
import { Suspense } from "react";
import { EndpointScreen } from "@/components/endpoint-screen";
import { ScreenStatus } from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "Endpoint",
};

export default function EndpointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ScreenStatus>Loading…</ScreenStatus>}>
      <EndpointPageContent params={params} />
    </Suspense>
  );
}

async function EndpointPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const endpointId = Number(id);

  if (!Number.isFinite(endpointId) || endpointId <= 0) {
    return <p className="p-8 text-sm text-destructive">Invalid id.</p>;
  }

  return <EndpointScreen endpointId={endpointId} />;
}
