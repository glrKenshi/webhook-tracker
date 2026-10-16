export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const deltaMs = date.getTime() - Date.now();
  const absSeconds = Math.round(Math.abs(deltaMs) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return rtf.format(Math.round(deltaMs / 1000), "second");
  if (absSeconds < 3600) return rtf.format(Math.round(deltaMs / 60000), "minute");
  if (absSeconds < 86400) return rtf.format(Math.round(deltaMs / 3600000), "hour");
  if (absSeconds < 604800) return rtf.format(Math.round(deltaMs / 86400000), "day");
  return formatDateTime(value);
}

export function formatBody(body: string | null, contentType: string | null): string {
  if (!body) return "(empty)";

  const looksJson =
    contentType?.includes("json") ||
    ((body.startsWith("{") || body.startsWith("[")) && body.length > 1);

  if (!looksJson) return body;

  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function formatHeaders(headers: string): string {
  try {
    return JSON.stringify(JSON.parse(headers), null, 2);
  } catch {
    return headers;
  }
}

export function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}
