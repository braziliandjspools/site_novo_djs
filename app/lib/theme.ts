/** Paleta inspirada na bandeira do Brasil */
export const BR = {
  green: "#009739",
  yellow: "#FFDF00",
  blue: "#002776",
  greenLight: "#00B347",
  yellowLight: "#FFE566",
  blueLight: "#1A3D8F",
} as const;

/** Base escura estilo streaming + acento verde */
export const SITE = {
  base: "#121212",
  elevated: "#181818",
  card: "#282828",
  hover: "#333333",
  muted: "#b3b3b3",
  accent: "#1DB954",
  accentHover: "#1ED760",
} as const;

export const PLACEHOLDER = {
  hero: "https://placehold.co/1920x900/002776/FFDF00?text=Imagem+Hero+%E2%80%94+substituir",
  curadoria: "/images/curadoria.png",
  ftpAccess: "/images/ftp-access.png",
  googleDrive: "/images/google-drive.png",
  raidrive: "/images/raidrive.png",
  showcase: "https://placehold.co/600x400/009739/FFDF00?text=Showcase+%E2%80%94+substituir",
  deemix: "/images/deemix.png",
  allavsoft: "/images/allavsoft.png",
  trackCover: "/images/folder.jpg",
  logo: "/images/brs-logo.jpg",
  musicProducerHero: "/images/music-producer.png",
  musicasPortal: "/images/musicas-portal.png",
  demoCover: "/images/logo.png",
} as const;

export const PREVIEW_PLAYLIST = {
  name: "SickMix – Razor Robs Transitions Vol. 1",
} as const;

export const CARD_COLORS = {
  green: {
    bg: "bg-[#009739]/15",
    text: "text-[#00B347]",
    border: "border-[#009739]/40",
    iconBg: "bg-[#009739]/25",
    hoverBorder: "hover:border-[#009739]/70",
  },
  yellow: {
    bg: "bg-[#FFDF00]/10",
    text: "text-[#FFDF00]",
    border: "border-[#FFDF00]/30",
    iconBg: "bg-[#FFDF00]/20",
    hoverBorder: "hover:border-[#FFDF00]/60",
  },
  blue: {
    bg: "bg-[#002776]/20",
    text: "text-[#6B9FFF]",
    border: "border-[#002776]/50",
    iconBg: "bg-[#002776]/30",
    hoverBorder: "hover:border-[#1A3D8F]/70",
  },
} as const;

export type CardColor = keyof typeof CARD_COLORS;
export const COLOR_CYCLE: CardColor[] = ["green", "yellow", "blue"];
