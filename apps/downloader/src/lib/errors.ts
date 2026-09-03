import { ApiError, NetworkError } from "./api/client";

export function formatApiError(err: unknown): string {
  if (err instanceof ApiError || err instanceof NetworkError) {
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === "string" && err.trim()) {
    return err;
  }
  return "Não foi possível entrar. Verifique e-mail, senha e servidor.";
}
