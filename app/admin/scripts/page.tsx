import type { Metadata } from "next";
import { AdminScriptsApp } from "../AdminScriptsApp";

export const metadata: Metadata = {
  title: "Scripts do portal | Brazilian Remix Service",
  robots: { index: false, follow: false },
};

export default function AdminScriptsPage() {
  return <AdminScriptsApp />;
}
