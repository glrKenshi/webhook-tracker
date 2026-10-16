const STORAGE_KEY = "webhook.session";

export type Session = {
  token: string;
  email: string;
};

type Snapshot = {
  ready: boolean;
  session: Session | null;
};

const serverSnapshot: Snapshot = { ready: false, session: null };
let snapshot: Snapshot = serverSnapshot;
const listeners = new Set<() => void>();

function readStored(): Session | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (typeof parsed.token !== "string" || parsed.token.length === 0) return null;
    if (typeof parsed.email !== "string" || parsed.email.length === 0) return null;
    return { token: parsed.token, email: parsed.email };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function emit(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    emit({ ready: true, session: readStored() });
  };

  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSessionSnapshot(): Snapshot {
  if (snapshot.ready || typeof window === "undefined") return snapshot;
  snapshot = { ready: true, session: readStored() };
  return snapshot;
}

export function getServerSessionSnapshot(): Snapshot {
  return serverSnapshot;
}

export function writeSession(session: Session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  emit({ ready: true, session });
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
  emit({ ready: true, session: null });
}
