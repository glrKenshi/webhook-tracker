export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs ? (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {breadcrumbs}
          </div>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
