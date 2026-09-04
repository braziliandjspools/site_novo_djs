import type { Metadata } from "next";
import { PortalApp } from "./PortalApp";
import { buildPageMetadata } from "../lib/seo";

export const metadata: Metadata = buildPageMetadata("portal");

export default function PortalPage() {
  return <PortalApp />;
}
