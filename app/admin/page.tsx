import type { Metadata } from "next";
import { AdminApp } from "./AdminApp";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("admin");

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] min-w-0 px-3 py-8 sm:px-4 md:px-6">
      <AdminApp />
    </main>
  );
}
