import type { Metadata } from "next";
import { LegalDocumentPage } from "../privacy/LegalDocumentPage";
import { buildPageMetadata } from "../lib/seo";
import { termsOfServiceDocument } from "./policy-content";

export const metadata: Metadata = buildPageMetadata("termos");

export default function TermosPage() {
  return <LegalDocumentPage document={termsOfServiceDocument} />;
}
