"use client";

import { AdminGate } from "../AdminGate";
import { AdminProducers } from "../AdminProducers";

export default function AdminProducersPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl overflow-x-hidden px-4 py-8 text-white sm:px-6">
      <AdminGate>
        <AdminProducers />
      </AdminGate>
    </main>
  );
}
