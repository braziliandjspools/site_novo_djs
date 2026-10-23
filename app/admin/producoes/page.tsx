import type { Metadata } from "next";
import { AdminProductionsApp } from "./AdminProductionsApp";

export const metadata: Metadata = {
  title: "Produções BRS | Admin",
  robots: { index: false, follow: false },
};

export default function AdminProducoesPage() {
  return <AdminProductionsApp />;
}
