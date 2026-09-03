import type { Metadata } from "next";
import { LegalDocumentPage } from "../LegalDocumentPage";
import { downloaderPrivacyDocument } from "./policy-content";

export const metadata: Metadata = {
  title: "Política de Privacidade — Brazilian Packs Downloader | Brazilian Remix Service",
  description:
    "Política de Privacidade do aplicativo Brazilian Packs Downloader (BRS Downloader).",
};

export default function PrivacyDownloaderRoute() {
  return <LegalDocumentPage document={downloaderPrivacyDocument} />;
}
