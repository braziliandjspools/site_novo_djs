import type { Metadata } from "next";
import { LegalDocumentPage } from "../LegalDocumentPage";
import { cookiesPolicyDocument } from "./policy-content";
import { buildPageMetadata } from "../../lib/seo";

export const metadata: Metadata = buildPageMetadata("privacy-cookies");

export default function PrivacyCookiesRoute() {
  return <LegalDocumentPage document={cookiesPolicyDocument} />;
}
