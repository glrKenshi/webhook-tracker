"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy01Icon,
  Delete02Icon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ScreenStatus } from "@/components/auth-shell";
import { CreateEndpointDialog } from "@/components/create-endpoint-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toast-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/copy";
import { formatDateTime } from "@/lib/format";
import { useAsyncLoad } from "@/hooks/use-async-load";
import {
  deleteEndpoint,
  listAllEvents,
  WebhookApiError,
} from "@/lib/webhook-api";
import type { WebhookEndpoint } from "@/lib/webhook-types";

export function EndpointsScreen() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<WebhookEndpoint | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const dialogOpen = createOpen || searchParams.get("create") === "1";

  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { endpoints: nextEndpoints, events } = await listAllEvents();
      setEndpoints(nextEndpoints);
      const counts: Record<number, number> = {};
      for (const event of events) {
        counts[event.webhook_endpoint_id] = (counts[event.webhook_endpoint_id] ?? 0) + 1;
      }
      setEventCounts(counts);
    } catch (loadError) {
      if (loadError instanceof WebhookApiError && loadError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(
        loadError instanceof WebhookApiError ? loadError.message : "Could not load endpoints.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useAsyncLoad(auth.status === "authenticated", load);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return endpoints;
    return endpoints.filter(
      (endpoint) =>
        endpoint.name.toLowerCase().includes(q) ||
        endpoint.url.toLowerCase().includes(q) ||
        endpoint.token.toLowerCase().includes(q),
    );
  }, [endpoints, query]);

  if (auth.status !== "authenticated" || !auth.email) {
    return <ScreenStatus>Loading…</ScreenStatus>;
  }

  async function handleCopy(endpoint: WebhookEndpoint) {
    const ok = await copyToClipboard(endpoint.url);
    toast(ok ? "Webhook URL copied" : "Could not copy URL", ok ? "success" : "error");
  }

  async function handleDelete() {
    if (!deleting) return;
    setConfirmingDelete(true);
    try {
      await deleteEndpoint(deleting.id);
      setEndpoints((current) => current.filter((item) => item.id !== deleting.id));
      toast("Endpoint deleted", "success");
      setDeleting(null);
    } catch (deleteError) {
      toast(
        deleteError instanceof WebhookApiError ? deleteError.message : "Could not delete endpoint.",
        "error",
      );
    } finally {
      setConfirmingDelete(false);
    }
  }

  function closeCreate() {
    setCreateOpen(false);
    if (searchParams.get("create") === "1") {
      router.replace("/endpoints");
    }
  }

  return (
    <AppShell
      title="Endpoints"
      actions={
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          Create endpoint
        </Button>
      }
    >
      <PageHeader
        title="Endpoints"
        description="Unique URLs that capture incoming webhook requests from external services."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search endpoints</span>
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or URL…"
            className="h-9 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : endpoints.length === 0 ? (
        <EmptyState
          title="No endpoints yet"
          description="Create your first endpoint, then configure GitHub or another service to POST to its URL."
          action={
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Create endpoint
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search term."
          action={
            <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Webhook URL</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Events</th>
                <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Created</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((endpoint) => (
                <tr key={endpoint.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/endpoints/${endpoint.id}`}
                      className="font-medium hover:text-primary"
                    >
                      {endpoint.name}
                    </Link>
                    <p className="mt-0.5 max-w-[14rem] truncate font-mono text-xs text-muted-foreground md:hidden">
                      {endpoint.url}
                    </p>
                  </td>
                  <td className="hidden max-w-xs px-4 py-3 md:table-cell">
                    <code className="block truncate font-mono text-xs text-muted-foreground">
                      {endpoint.url}
                    </code>
                  </td>
                  <td className="hidden px-4 py-3 tabular-nums text-muted-foreground sm:table-cell">
                    {eventCounts[endpoint.id] ?? 0}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {formatDateTime(endpoint.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Copy URL for ${endpoint.name}`}
                        onClick={() => void handleCopy(endpoint)}
                      >
                        <HugeiconsIcon icon={Copy01Icon} size={16} />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${endpoint.name}`}
                        onClick={() => setDeleting(endpoint)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateEndpointDialog
        open={dialogOpen}
        onClose={closeCreate}
        onCreated={(endpoint) => {
          setEndpoints((current) => [endpoint, ...current]);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete endpoint?"
        description={
          deleting
            ? `Delete “${deleting.name}” and all of its received events? This cannot be undone.`
            : ""
        }
        confirming={confirmingDelete}
        onClose={() => {
          if (!confirmingDelete) setDeleting(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </AppShell>
  );
}
