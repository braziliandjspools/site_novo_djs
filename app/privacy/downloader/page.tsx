import type { Metadata } from "next";
import { DownloaderPrivacyPage } from "./DownloaderPrivacyPage";

export const metadata: Metadata = {
  title: "Política de Privacidade — Brazilian Packs Downloader | Brazilian Remix Service",
  description:
    "Política de Privacidade do aplicativo Brazilian Packs Downloader (BRS Downloader).",
};

export default function PrivacyDownloaderRoute() {
  return <DownloaderPrivacyPage />;
}
