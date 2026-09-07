import type { Metadata } from "next";
import { AdminApp } from "./AdminApp";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("admin");

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-10 sm:px-6">
      <AdminApp />
    </main>
  );
}
