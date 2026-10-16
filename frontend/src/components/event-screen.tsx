"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
import { ScreenStatus } from "@/components/auth-shell";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { useAsyncLoad } from "@/hooks/use-async-load";
import { copyToClipboard } from "@/lib/copy";
import { formatBody, formatDateTime, formatHeaders } from "@/lib/format";
import { getEndpoint, getEvent, WebhookApiError } from "@/lib/webhook-api";
import type { WebhookEndpoint, WebhookEvent } from "@/lib/webhook-types";

export function EventScreen({ eventId }: { eventId: number }) {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [event, setEvent] = useState<WebhookEvent | null>(null);
  const [endpoint, setEndpoint] = useState<WebhookEndpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status === "anonymous") {
      router.replace("/login");
    }
  }, [auth.status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextEvent = await getEvent(eventId);
      setEvent(nextEvent);
      try {
        setEndpoint(await getEndpoint(nextEvent.webhook_endpoint_id));
      } catch {
        setEndpoint(null);
      }
    } catch (loadError) {
      if (loadError instanceof WebhookApiError && loadError.status === 401) {
        router.replace("/login");
        return;
      }
      setError(loadError instanceof WebhookApiError ? loadError.message : "Could not load event.");
    } finally {
      setLoading(false);
    }
  }, [eventId, router]);

  useAsyncLoad(auth.status === "authenticated", load);

  if (auth.status !== "authenticated" || !auth.email) {
    return <ScreenStatus>Loading…</ScreenStatus>;
  }

  async function handleCopy(label: string, value: string) {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopiedField(label);
      toast(`${label} copied`, "success");
      window.setTimeout(() => setCopiedField(null), 1500);
    } else {
      toast(`Could not copy ${label.toLowerCase()}`, "error");
    }
  }

  const headersText = event ? formatHeaders(event.headers) : "";
  const bodyText = event ? formatBody(event.body, event.content_type) : "";

  return (
    <AppShell title="Event details">
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !event ? (
        <p className="text-sm text-destructive">{error ?? "Event not found."}</p>
      ) : (
        <>
          <PageHeader
            title={
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex rounded-md bg-muted px-2 py-0.5 font-mono text-base font-semibold">
                  {event.http_method}
                </span>
                <span>Request</span>
              </span>
            }
            description={`${formatDateTime(event.created_at)}${event.content_type ? ` · ${event.content_type}` : ""}`}
            breadcrumbs={
              <>
                <Link href="/events" className="hover:text-foreground">
                  Events
                </Link>
                <span>/</span>
                <Link
                  href={`/endpoints/${event.webhook_endpoint_id}`}
                  className="hover:text-foreground"
                >
                  {endpoint?.name ?? "Endpoint"}
                </Link>
                <span>/</span>
                <span className="font-mono text-foreground">{event.http_method}</span>
              </>
            }
          />

          {error ? (
            <p role="alert" className="mb-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <dl className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Endpoint
              </dt>
              <dd className="mt-1 text-sm">
                <Link
                  href={`/endpoints/${event.webhook_endpoint_id}`}
                  className="font-medium hover:text-primary"
                >
                  {endpoint?.name ?? `Endpoint #${event.webhook_endpoint_id}`}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Received
              </dt>
              <dd className="mt-1 text-sm">{formatDateTime(event.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Method
              </dt>
              <dd className="mt-1 font-mono text-sm">{event.http_method}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Content type
              </dt>
              <dd className="mt-1 font-mono text-sm text-muted-foreground">
                {event.content_type || "—"}
              </dd>
            </div>
          </dl>

          <section className="space-y-4">
            <PayloadPanel
              title="Headers"
              value={headersText}
              copied={copiedField === "Headers"}
              onCopy={() => void handleCopy("Headers", headersText)}
            />
            <PayloadPanel
              title="Body"
              value={bodyText}
              copied={copiedField === "Body"}
              onCopy={() => void handleCopy("Body", bodyText)}
              wrap
            />
          </section>
        </>
      )}
    </AppShell>
  );
}

function PayloadPanel({
  title,
  value,
  copied,
  onCopy,
  wrap = false,
}: {
  title: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  wrap?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-medium">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onCopy}>
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre
        className={`max-h-[32rem] overflow-auto bg-muted/30 p-4 font-mono text-xs leading-relaxed text-foreground ${
          wrap ? "whitespace-pre-wrap break-words" : ""
        }`}
      >
        {value}
      </pre>
    </div>
  );
}
