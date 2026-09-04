import type { Metadata } from "next";
import { LegalDocumentPage } from "../LegalDocumentPage";
import { downloaderPrivacyDocument } from "./policy-content";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("privacy-downloader");

export default function PrivacyDownloaderRoute() {
  return <LegalDocumentPage document={downloaderPrivacyDocument} />;
}
