export type AppNotificationKind = "plan" | "download" | "update" | "info";
export type AppNotificationSeverity = "info" | "success" | "warning" | "error";

export type AppNotificationAction =
  | { type: "portal"; label: string }
  | { type: "update"; label: string; url: string }
  | { type: "settings"; label: string }
  | { type: "url"; label: string; url: string };

export type AppNotification = {
  id: string;
  kind: AppNotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  severity: AppNotificationSeverity;
  action?: AppNotificationAction;
  /** Evita duplicar o mesmo aviso (ex.: update 0.3.0). */
  dedupeKey?: string;
};

type Listener = (items: AppNotification[]) => void;

const MAX_ITEMS = 40;

class InAppNotificationFeed {
  private items: AppNotification[] = [];
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.list());
    return () => {
      this.listeners.delete(listener);
    };
  }

  list() {
    return [...this.items];
  }

  unreadCount() {
    return this.items.filter((item) => !item.read).length;
  }

  push(input: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string; read?: boolean }) {
    if (input.dedupeKey) {
      const existing = this.items.find((item) => item.dedupeKey === input.dedupeKey && !item.read);
      if (existing) {
        existing.title = input.title;
        existing.body = input.body;
        existing.severity = input.severity;
        existing.action = input.action;
        existing.createdAt = Date.now();
        this.emit();
        return existing.id;
      }
    }

    const item: AppNotification = {
      id: input.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: input.kind,
      title: input.title,
      body: input.body,
      createdAt: Date.now(),
      read: input.read ?? false,
      severity: input.severity,
      action: input.action,
      dedupeKey: input.dedupeKey,
    };
    this.items = [item, ...this.items].slice(0, MAX_ITEMS);
    this.emit();
    return item.id;
  }

  markRead(id: string) {
    const item = this.items.find((entry) => entry.id === id);
    if (!item || item.read) return;
    item.read = true;
    this.emit();
  }

  markAllRead() {
    let changed = false;
    for (const item of this.items) {
      if (!item.read) {
        item.read = true;
        changed = true;
      }
    }
    if (changed) this.emit();
  }

  dismiss(id: string) {
    const next = this.items.filter((item) => item.id !== id);
    if (next.length === this.items.length) return;
    this.items = next;
    this.emit();
  }

  clear() {
    if (this.items.length === 0) return;
    this.items = [];
    this.emit();
  }

  private emit() {
    const snapshot = this.list();
    for (const listener of this.listeners) listener(snapshot);
  }
}

export const inAppNotificationFeed = new InAppNotificationFeed();
