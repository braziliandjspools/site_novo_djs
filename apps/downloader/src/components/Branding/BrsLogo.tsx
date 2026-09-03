import { BRS_LOGO_SRC, SITE_NAME, SITE_SHORT } from "../lib/site";

type BrsLogoProps = {
  className?: string;
};

const DEFAULT_CLASS = "h-10 w-auto max-w-[220px] object-contain object-left";

export function BrsLogo({ className = DEFAULT_CLASS }: BrsLogoProps) {
  return (
    <img
      src={BRS_LOGO_SRC}
      alt={`${SITE_NAME} (${SITE_SHORT})`}
      className={className}
      width={560}
      height={140}
    />
  );
}
