import { permanentRedirect } from "next/navigation";

/** Deemix descontinuado — redireciona para Allavsoft. */
export default function DeemixRedirectPage() {
  permanentRedirect("/allavsoft");
}
