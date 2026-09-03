import type { Metadata } from "next";
import { LegalDocumentPage } from "../LegalDocumentPage";
import { cookiesPolicyDocument } from "./policy-content";

export const metadata: Metadata = {
  title: "Política de Cookies | Brazilian Remix Service",
  description: "Política de Cookies da Brazilian Remix Service e Brazilian Packs.",
};

export default function PrivacyCookiesRoute() {
  return <LegalDocumentPage document={cookiesPolicyDocument} />;
}
