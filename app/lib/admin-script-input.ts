export type AdminScriptFields = {
  title?: string;
  description?: string;
  fileName?: string;
  script?: string;
  language?: "powershell";
  active?: boolean;
};

const limits = {
  title: 120,
  description: 4_000,
  fileName: 180,
  script: 500_000,
} as const;

export function parseAdminScriptFields(
  value: unknown,
  options: { partial?: boolean } = {},
): { data?: AdminScriptFields; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: "Requisição inválida." };
  }

  const body = value as Record<string, unknown>;
  const data: AdminScriptFields = {};
  const partial = options.partial === true;

  for (const field of ["title", "description", "fileName", "script"] as const) {
    const raw = body[field];
    if (raw === undefined && partial) continue;
    if (typeof raw !== "string") return { error: `Campo inválido: ${field}.` };

    const normalized = field === "script" ? raw : raw.trim();
    if (!normalized.trim()) return { error: `Preencha o campo ${field}.` };
    if (normalized.length > limits[field]) {
      return { error: `O campo ${field} ultrapassa o limite de ${limits[field]} caracteres.` };
    }

    if (field === "title") data.title = normalized;
    else if (field === "description") data.description = normalized;
    else if (field === "script") data.script = normalized;
    else {
      if (!/^[\p{L}\p{N} _().-]+\.ps1$/iu.test(normalized)) {
        return { error: "Informe apenas o nome do arquivo PowerShell, terminado em .ps1." };
      }
      data.fileName = normalized;
    }
  }

  if (body.language !== undefined) {
    if (body.language !== "powershell") return { error: "A linguagem deve ser PowerShell." };
    data.language = "powershell";
  }

  if (body.active !== undefined) {
    if (typeof body.active !== "boolean") return { error: "O campo active deve ser verdadeiro ou falso." };
    data.active = body.active;
  }

  if (partial && Object.keys(data).length === 0) {
    return { error: "Informe ao menos um campo para atualizar." };
  }

  return { data };
}
