import type { Metadata } from "next";
import { AdminProductionsApp } from "./AdminProductionsApp";

export const metadata: Metadata = {
  title: "Produções BRS | Admin",
  robots: { index: false, follow: false },
};

export default function AdminProducoesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <AdminProductionsApp />
    </main>
  );
}
