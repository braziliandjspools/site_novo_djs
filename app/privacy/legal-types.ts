export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "pre"; text: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  intro: LegalBlock[];
  sections: LegalSection[];
  contactEmail: string;
  contactSubject: string;
  ctaLabel: string;
};

export const LEGAL_CONTACT_EMAIL = "brazilianremixservice@gmail.com";
