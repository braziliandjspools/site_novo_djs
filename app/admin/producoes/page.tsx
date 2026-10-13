import type { Metadata } from "next";
import { AdminProductionsApp } from "./AdminProductionsApp";

export const metadata: Metadata = {
  title: "Produções BRS | Admin",
  robots: { index: false, follow: false },
};

export default function AdminProducoesPage() {
  return (
    <main className="admin-productions-main mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <AdminProductionsApp />
    </main>
  );
}
