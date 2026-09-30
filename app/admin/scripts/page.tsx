import type { Metadata } from "next";
import { AdminScriptsApp } from "../AdminScriptsApp";

export const metadata: Metadata = {
  title: "Scripts do portal | Brazilian Remix Service",
  robots: { index: false, follow: false },
};

export default function AdminScriptsPage() {
  return (
    <main className="mx-auto w-full max-w-[1600px] min-w-0 px-3 py-8 sm:px-4 md:px-6">
      <AdminScriptsApp />
    </main>
  );
}
