export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center bg-background px-4 py-16">
      <div className="relative w-full max-w-[24rem] rounded-xl border border-border bg-card p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}

export function ScreenStatus({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell>
      <p className="text-sm text-muted-foreground">{children}</p>
    </AuthShell>
  );
}
