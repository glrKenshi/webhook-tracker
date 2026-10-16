"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ScreenStatus } from "@/components/auth-shell";
import { CreateEndpointDialog } from "@/components/create-endpoint-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAsyncLoad } from "@/hooks/use-async-load";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import {
  listAllEvents,
  WebhookApiError,
  type EventWithEndpoint,
} from "@/lib/webhook-api";
import type { WebhookEndpoint } from "@/lib/webhook-types";

export function OverviewScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<EventWithEndpoint[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { endpoints: nextEndpoints, events: nextEvents } = await listAllEvents();
      setEndpoints(nextEndpoints);
      setEvents(nextEvents);
      const counts: Record<number, number> = {};
      for (const event of nextEvents) {
        counts[event.webhook_endpoint_id] = (counts[event.webhook_endpoint_id] ?? 0) + 1;
      }
      setEventCounts(counts);
    } catch (loadError) {
      if (loadError instanceof WebhookApiError && loadError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(loadError instanceof WebhookApiError ? loadError.message : "Could not load overview.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useAsyncLoad(auth.status === "authenticated", load);

  if (auth.status !== "authenticated" || !auth.email) {
    return <ScreenStatus>Loading…</ScreenStatus>;
  }

  const recentEvents = events.slice(0, 8);
  const recentEndpoints = endpoints.slice(0, 5);

  return (
    <AppShell
      title="Overview"
      actions={
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Create endpoint
        </Button>
      }
    >
      <PageHeader
        title="Overview"
        description="Your webhook workspace — endpoints and recently received requests."
        actions={
          <Button type="button" className="sm:hidden" onClick={() => setCreateOpen(true)}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Create endpoint
          </Button>
        }
      />

      {error ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Endpoints" value={loading ? "—" : String(endpoints.length)} />
        <MetricCard label="Received events" value={loading ? "—" : String(events.length)} />
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent events</h2>
            <Link href="/events" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recentEvents.length === 0 ? (
            <EmptyState
              title="No events yet"
              description="Once an external service posts to one of your endpoints, requests will show up here."
              action={
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                  Create endpoint
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Received</th>
                    <th className="px-4 py-2.5 font-medium">Method</th>
                    <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/events/${event.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {formatRelativeTime(event.created_at)}
                        </Link>
                        <p className="text-xs text-muted-foreground sm:hidden">
                          {event.endpoint.name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
                          {event.http_method}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        <Link
                          href={`/endpoints/${event.endpoint.id}`}
                          className="hover:text-foreground"
                        >
                          {event.endpoint.name}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent endpoints</h2>
            <Link href="/endpoints" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recentEndpoints.length === 0 ? (
            <EmptyState
              title="No endpoints"
              description="Create an endpoint to start capturing webhooks."
              action={
                <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                  Create endpoint
                </Button>
              }
            />
          ) : (
            <ul className="overflow-hidden rounded-xl border border-border bg-card">
              {recentEndpoints.map((endpoint) => (
                <li key={endpoint.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/endpoints/${endpoint.id}`}
                    className="block px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{endpoint.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {eventCounts[endpoint.id] ?? 0} events
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {endpoint.url}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatDateTime(endpoint.created_at)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <CreateEndpointDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(endpoint) => {
          setEndpoints((current) => [endpoint, ...current]);
        }}
      />
    </AppShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}
