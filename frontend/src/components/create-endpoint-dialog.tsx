"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast-provider";
import { copyToClipboard } from "@/lib/copy";
import { createEndpoint, WebhookApiError } from "@/lib/webhook-api";
import type { WebhookEndpoint } from "@/lib/webhook-types";

export function CreateEndpointDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (endpoint: WebhookEndpoint) => void;
}) {
  // Remount form state whenever the dialog opens so we avoid reset-in-effect.
  return open ? (
    <CreateEndpointDialogInner onClose={onClose} onCreated={onCreated} />
  ) : null;
}

function CreateEndpointDialogInner({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (endpoint: WebhookEndpoint) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<WebhookEndpoint | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter an endpoint name.");
      inputRef.current?.focus();
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const endpoint = await createEndpoint(trimmed);
      setCreated(endpoint);
      onCreated(endpoint);
      toast("Endpoint created", "success");
    } catch (createError) {
      setError(
        createError instanceof WebhookApiError
          ? createError.message
          : "Could not create endpoint.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!created) return;
    const ok = await copyToClipboard(created.url);
    if (ok) {
      setCopied(true);
      toast("Webhook URL copied", "success");
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      toast("Could not copy URL", "error");
    }
  }

  return (
    <Modal
      open
      title={created ? "Endpoint ready" : "Create endpoint"}
      description={
        created
          ? "Configure your external service to send HTTP POST requests to this URL."
          : "Give your webhook endpoint a short, memorable name."
      }
      onClose={onClose}
    >
      {created ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">{created.name}</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <code className="block flex-1 overflow-x-auto rounded-lg border border-border bg-muted/60 px-3 py-2 font-mono text-xs">
                {created.url}
              </code>
              <Button type="button" variant="outline" onClick={() => void handleCopy()}>
                <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <ol className="list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
            <li>Copy the webhook URL.</li>
            <li>Open webhook settings in GitHub or another service.</li>
            <li>Point the service at this URL and send a test event.</li>
          </ol>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                onClose();
                router.push(`/endpoints/${created.id}`);
              }}
            >
              View endpoint
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor={formId} className="text-sm font-medium">
              Name
            </label>
            <input
              ref={inputRef}
              id={formId}
              type="text"
              value={name}
              maxLength={100}
              disabled={creating}
              autoFocus
              placeholder="e.g. GitHub production"
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50"
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={creating} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create endpoint"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
