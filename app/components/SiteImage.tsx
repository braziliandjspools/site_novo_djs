import Image from "next/image";
import type { CSSProperties } from "react";

type SiteImageBaseProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  sizes?: string;
  quality?: number;
};

type SiteImageFillProps = SiteImageBaseProps & {
  fill: true;
  width?: never;
  height?: never;
};

type SiteImageSizedProps = SiteImageBaseProps & {
  fill?: false;
  width: number;
  height: number;
};

export type SiteImageProps = SiteImageFillProps | SiteImageSizedProps;

export function SiteImage({
  src,
  alt,
  className,
  style,
  priority = false,
  sizes,
  quality = 80,
  ...sizeProps
}: SiteImageProps) {
  if ("fill" in sizeProps && sizeProps.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        style={style}
        priority={priority}
        sizes={sizes ?? "100vw"}
        quality={quality}
      />
    );
  }

  const { width, height } = sizeProps as SiteImageSizedProps;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      priority={priority}
      sizes={sizes}
      quality={quality}
    />
  );
}
