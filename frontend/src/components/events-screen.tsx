"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ScreenStatus } from "@/components/auth-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAsyncLoad } from "@/hooks/use-async-load";
import { formatDateTime } from "@/lib/format";
import {
  listAllEvents,
  WebhookApiError,
  type EventWithEndpoint,
} from "@/lib/webhook-api";
import type { WebhookEndpoint } from "@/lib/webhook-types";

export function EventsScreen() {
  const auth = useAuth();
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<EventWithEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [endpointFilter, setEndpointFilter] = useState<string>("all");

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
    } catch (loadError) {
      if (loadError instanceof WebhookApiError && loadError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(loadError instanceof WebhookApiError ? loadError.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useAsyncLoad(auth.status === "authenticated", load);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      if (endpointFilter !== "all" && String(event.webhook_endpoint_id) !== endpointFilter) {
        return false;
      }
      if (!q) return true;
      return (
        event.http_method.toLowerCase().includes(q) ||
        event.endpoint.name.toLowerCase().includes(q) ||
        (event.content_type ?? "").toLowerCase().includes(q) ||
        (event.body ?? "").toLowerCase().includes(q)
      );
    });
  }, [events, query, endpointFilter]);

  if (auth.status !== "authenticated" || !auth.email) {
    return <ScreenStatus>Loading…</ScreenStatus>;
  }

  return (
    <AppShell
      title="Events"
      actions={
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          <HugeiconsIcon icon={RefreshIcon} size={16} />
          Refresh
        </Button>
      }
    >
      <PageHeader
        title="Events"
        description="Incoming webhook requests captured by your endpoints."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search events</span>
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search method, endpoint, content type, or body…"
            className="h-9 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">Filter by endpoint</span>
          <select
            value={endpointFilter}
            onChange={(event) => setEndpointFilter(event.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <option value="all">All endpoints</option>
            {endpoints.map((endpoint) => (
              <option key={endpoint.id} value={String(endpoint.id)}>
                {endpoint.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Send an HTTP request to one of your endpoint URLs, then refresh this page."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => router.push("/endpoints")}>
              Go to endpoints
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try adjusting your search or endpoint filter."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQuery("");
                setEndpointFilter("all");
              }}
            >
              Clear filters
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
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Content type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {formatDateTime(event.created_at)}
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
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Link
                      href={`/endpoints/${event.endpoint.id}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {event.endpoint.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                    {event.content_type || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
