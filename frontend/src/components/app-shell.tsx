"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity01Icon,
  Cancel01Icon,
  DashboardSquare01Icon,
  Link01Icon,
  Logout01Icon,
  Menu01Icon,
  WebhookIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { AuthApiError } from "@/lib/auth-api";
import { initialsFromEmail } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Overview", icon: DashboardSquare01Icon, match: (path: string) => path === "/" },
  {
    href: "/endpoints",
    label: "Endpoints",
    icon: Link01Icon,
    match: (path: string) => path === "/endpoints" || path.startsWith("/endpoints/"),
  },
  {
    href: "/events",
    label: "Events",
    icon: Activity01Icon,
    match: (path: string) => path === "/events" || path.startsWith("/events/"),
  },
] as const;

function breadcrumbLabel(pathname: string): string {
  if (pathname === "/") return "Overview";
  if (pathname === "/endpoints") return "Endpoints";
  if (pathname.startsWith("/endpoints/")) return "Endpoint details";
  if (pathname === "/events") return "Events";
  if (pathname.startsWith("/events/")) return "Event details";
  return "Dashboard";
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-3">
      {NAV.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={item.icon} size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountBlock({
  email,
  signingOut,
  signOutError,
  onSignOut,
}: {
  email: string;
  signingOut: boolean;
  signOutError: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="border-t border-sidebar-border px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        >
          {initialsFromEmail(email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={email}>
            {email || "—"}
          </p>
          <button
            type="button"
            disabled={signingOut}
            onClick={onSignOut}
            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <HugeiconsIcon icon={Logout01Icon} size={12} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
      {signOutError ? (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {signOutError}
        </p>
      ) : null}
    </div>
  );
}

export function AppShell({
  children,
  actions,
  title,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  title?: string;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const email = auth.email ?? "";
  const pageTitle = title ?? breadcrumbLabel(pathname);

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(null);
    try {
      await auth.signOut();
    } catch (error) {
      setSignOutError(error instanceof AuthApiError ? error.message : "Could not sign out.");
    } finally {
      router.replace("/login");
      setSigningOut(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="border-b border-sidebar-border px-4 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HugeiconsIcon icon={WebhookIcon} size={16} />
            </span>
            <span className="text-sm font-semibold tracking-tight">Webhook Inbox</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav pathname={pathname} />
        </div>
        <AccountBlock
          email={email}
          signingOut={signingOut}
          signOutError={signOutError}
          onSignOut={() => void handleSignOut()}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-sidebar shadow-xl">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <Link
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setMobileOpen(false)}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <HugeiconsIcon icon={WebhookIcon} size={16} />
                </span>
                <span className="text-sm font-semibold tracking-tight">Webhook Inbox</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <AccountBlock
              email={email}
              signingOut={signingOut}
              signOutError={signOutError}
              onSignOut={() => void handleSignOut()}
            />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur-sm md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <HugeiconsIcon icon={Menu01Icon} size={18} />
          </Button>

          <div className="min-w-0 flex-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
              <span className="hidden text-muted-foreground sm:inline">Dashboard</span>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <span className="truncate font-medium text-foreground">{pageTitle}</span>
            </nav>
          </div>

          {actions ? <div className="hidden items-center gap-2 sm:flex">{actions}</div> : null}

          <div
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary md:hidden"
          >
            {initialsFromEmail(email)}
          </div>
        </header>

        {actions ? (
          <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2 sm:hidden">
            {actions}
          </div>
        ) : null}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
