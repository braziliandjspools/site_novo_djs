import Image from "next/image";
import Link from "next/link";
import { BRS_LOGO_SRC, SITE_NAME, SITE_SHORT } from "../lib/branding";

type BrsLogoProps = {
  href?: string | null;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

const DEFAULT_CLASS = "h-10 w-auto max-w-[240px] object-contain sm:h-11 sm:max-w-[280px]";

export function BrsLogo({
  href = "/",
  className = DEFAULT_CLASS,
  priority = false,
  sizes = "(max-width: 640px) 220px, 280px",
}: BrsLogoProps) {
  const image = (
    <Image
      src={BRS_LOGO_SRC}
      alt={`${SITE_NAME} (${SITE_SHORT})`}
      width={560}
      height={140}
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex flex-shrink-0">
        {image}
      </Link>
    );
  }

  return image;
}

export { BRS_LOGO_SRC, SITE_NAME, SITE_SHORT };
