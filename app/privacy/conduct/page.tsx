import type { Metadata } from "next";
import { LegalDocumentPage } from "../LegalDocumentPage";
import { codeOfConductDocument } from "./policy-content";

export const metadata: Metadata = {
  title: "Código de Conduta | Brazilian Remix Service",
  description: "Código de Conduta da Brazilian Remix Service, Brazilian Packs e Downloader.",
};

export default function PrivacyConductRoute() {
  return <LegalDocumentPage document={codeOfConductDocument} />;
}
