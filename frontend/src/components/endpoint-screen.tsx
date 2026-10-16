"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Copy01Icon,
  Delete02Icon,
  RefreshIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ScreenStatus } from "@/components/auth-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useAsyncLoad } from "@/hooks/use-async-load";
import { copyToClipboard } from "@/lib/copy";
import { formatDateTime } from "@/lib/format";
import {
  deleteEndpoint,
  getEndpoint,
  listEvents,
  WebhookApiError,
} from "@/lib/webhook-api";
import type { WebhookEndpoint, WebhookEvent } from "@/lib/webhook-types";

export function EndpointScreen({ endpointId }: { endpointId: number }) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [endpoint, setEndpoint] = useState<WebhookEndpoint | null>(null);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextEndpoint, nextEvents] = await Promise.all([
        getEndpoint(endpointId),
        listEvents(endpointId),
      ]);
      setEndpoint(nextEndpoint);
      setEvents(nextEvents);
    } catch (loadError) {
      if (loadError instanceof WebhookApiError && loadError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(loadError instanceof WebhookApiError ? loadError.message : "Could not load endpoint.");
    } finally {
      setLoading(false);
    }
  }, [endpointId, router]);

  useAsyncLoad(auth.status === "authenticated", load);

  if (auth.status !== "authenticated" || !auth.email) {
    return <ScreenStatus>Loading…</ScreenStatus>;
  }

  async function handleCopy() {
    if (!endpoint) return;
    const ok = await copyToClipboard(endpoint.url);
    if (ok) {
      setCopied(true);
      toast("Webhook URL copied", "success");
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      toast("Could not copy URL", "error");
    }
  }

  async function handleDelete() {
    if (!endpoint) return;
    setDeleting(true);
    try {
      await deleteEndpoint(endpoint.id);
      toast("Endpoint deleted", "success");
      router.replace("/endpoints");
    } catch (deleteError) {
      toast(
        deleteError instanceof WebhookApiError ? deleteError.message : "Could not delete endpoint.",
        "error",
      );
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <AppShell title={endpoint?.name ?? "Endpoint details"}>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !endpoint ? (
        <p className="text-sm text-destructive">{error ?? "Endpoint not found."}</p>
      ) : (
        <>
          <PageHeader
            title={endpoint.name}
            description={`Created ${formatDateTime(endpoint.created_at)} · ${events.length} event${events.length === 1 ? "" : "s"}`}
            breadcrumbs={
              <>
                <Link href="/endpoints" className="hover:text-foreground">
                  Endpoints
                </Link>
                <span>/</span>
                <span className="text-foreground">{endpoint.name}</span>
              </>
            }
            actions={
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                  <HugeiconsIcon icon={RefreshIcon} size={16} />
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                  Delete
                </Button>
              </>
            }
          />

          {error ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <section className="mb-8 rounded-xl border border-border bg-card p-4 md:p-5">
            <p className="text-sm font-medium">Webhook URL</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Point an external service at this URL to capture incoming requests.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <code className="block flex-1 overflow-x-auto rounded-lg border border-border bg-muted/50 px-3 py-2.5 font-mono text-xs sm:text-sm">
                {endpoint.url}
              </code>
              <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>

            <div className="mt-5 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm font-medium">Setup guide</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
                <li>Copy the webhook URL above.</li>
                <li>Open webhook settings in the external service (for example GitHub).</li>
                <li>Configure the service to send webhook requests to this URL.</li>
                <li>Trigger a test event, then return here to inspect the request.</li>
              </ol>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Recent events</h2>
              <Link href="/events" className="text-xs font-medium text-primary hover:underline">
                All events
              </Link>
            </div>

            {events.length === 0 ? (
              <EmptyState
                title="Waiting for the first request"
                description="No events have arrived yet. Send a POST to the webhook URL to see it here."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Received</th>
                      <th className="px-4 py-2.5 font-medium">Method</th>
                      <th className="hidden px-4 py-2.5 font-medium sm:table-cell">
                        Content type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3">
                          <Link
                            href={`/events/${event.id}`}
                            className="font-medium hover:text-primary"
                          >
                            {formatDateTime(event.created_at)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
                            {event.http_method}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">
                          {event.content_type || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <ConfirmDialog
            open={confirmOpen}
            title="Delete endpoint?"
            description={`Delete “${endpoint.name}” and all of its received events? This cannot be undone.`}
            confirming={deleting}
            onClose={() => {
              if (!deleting) setConfirmOpen(false);
            }}
            onConfirm={() => void handleDelete()}
          />
        </>
      )}
    </AppShell>
  );
}
