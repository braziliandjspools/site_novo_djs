import { MusicasAuthLayout } from "./MusicasAuthLayout";

export default function MusicasLayout({ children }: LayoutProps<"/musicas">) {
  return <MusicasAuthLayout>{children}</MusicasAuthLayout>;
}
