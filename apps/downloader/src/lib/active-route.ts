import type { AppRoute } from "../components/layout/Sidebar";

const ROUTE_STORAGE_KEY = "bp-downloader-active-route";

const VALID_ROUTES = new Set<AppRoute>([
  "home",
  "downloads",
  "queue",
  "completed",
  "history",
  "portal",
  "settings",
]);

export function loadActiveRoute(fallback: AppRoute = "home"): AppRoute {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(ROUTE_STORAGE_KEY);
    if (raw && VALID_ROUTES.has(raw as AppRoute)) {
      return raw as AppRoute;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function persistActiveRoute(route: AppRoute) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROUTE_STORAGE_KEY, route);
  } catch {
    /* ignore */
  }
}
