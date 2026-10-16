import type { Metadata } from "next";
import { Suspense } from "react";
import { EventScreen } from "@/components/event-screen";
import { ScreenStatus } from "@/components/auth-shell";

export const metadata: Metadata = {
  title: "Event",
};

export default function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ScreenStatus>Loading…</ScreenStatus>}>
      <EventPageContent params={params} />
    </Suspense>
  );
}

async function EventPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);

  if (!Number.isFinite(eventId) || eventId <= 0) {
    return <p className="p-8 text-sm text-destructive">Invalid id.</p>;
  }

  return <EventScreen eventId={eventId} />;
}
