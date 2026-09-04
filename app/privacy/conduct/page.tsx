import type { Metadata } from "next";
import { LegalDocumentPage } from "../LegalDocumentPage";
import { codeOfConductDocument } from "./policy-content";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("privacy-conduct");

export default function PrivacyConductRoute() {
  return <LegalDocumentPage document={codeOfConductDocument} />;
}
