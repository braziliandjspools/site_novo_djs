import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "../../lib/seo";
import { PortalApp } from "../PortalApp";
import { parsePortalSlug, PORTAL_BASE } from "../portal-routes";

export const metadata: Metadata = buildPageMetadata("portal");

export default async function PortalPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const segments = slug ?? [];

  if (segments.length > 1) {
    redirect(PORTAL_BASE);
  }

  const segment = segments[0];
  if (segment && parsePortalSlug(segment) == null) {
    redirect(PORTAL_BASE);
  }

  return <PortalApp />;
}
