import type { Metadata } from "next";
import { AdminApp } from "./AdminApp";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("admin");

export default function AdminPage() {
  return <AdminApp />;
}
