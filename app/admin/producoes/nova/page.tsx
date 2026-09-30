"use client";

import Link from "next/link";
import { AdminGate } from "../../AdminGate";
import { AdminProductionForm } from "../../AdminProductionForm";

export default function NewProductionPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl overflow-x-hidden px-4 py-8 text-white sm:px-6">
      <AdminGate>
        <Link href="/admin/producoes" className="mb-4 inline-block text-xs text-[#1db954]">Voltar</Link>
        <h1 className="mb-4 text-2xl font-semibold">Nova produção</h1>
        <AdminProductionForm />
      </AdminGate>
    </main>
  );
}
