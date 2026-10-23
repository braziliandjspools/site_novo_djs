"use client";

import { AdminGate } from "../AdminGate";
import { AdminProducers } from "../AdminProducers";

export default function AdminProducersPage() {
  return (
    <AdminGate>
      <AdminProducers />
    </AdminGate>
  );
}
