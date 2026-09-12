import { randomBytes } from "crypto";

/** ID curto compatível com cuid-like sem dependência extra. */
export function createId() {
  return `gs_${Date.now().toString(36)}_${randomBytes(8).toString("hex")}`;
}
