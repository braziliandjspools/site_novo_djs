import assert from "node:assert/strict";
import test from "node:test";
import { parseAdminScriptFields } from "./admin-script-input";

test("valida campos de um script PowerShell para cadastro", () => {
  const result = parseAdminScriptFields({
    title: " Reunir músicas ",
    description: " Faz a organização. ",
    fileName: "reunir-musicas.ps1",
    script: "Write-Host 'ok'\n",
  });

  assert.equal(result.error, undefined);
  assert.deepEqual(result.data, {
    title: "Reunir músicas",
    description: "Faz a organização.",
    fileName: "reunir-musicas.ps1",
    script: "Write-Host 'ok'\n",
  });
});

test("recusa caminho no nome do arquivo e código vazio", () => {
  assert.match(
    parseAdminScriptFields({
      title: "Script",
      description: "Descrição",
      fileName: "../script.ps1",
      script: "Write-Host 'ok'",
    }).error ?? "",
    /nome do arquivo/,
  );

  assert.match(
    parseAdminScriptFields({
      title: "Script",
      description: "Descrição",
      fileName: "script.ps1",
      script: "   \n",
    }).error ?? "",
    /script/,
  );
});

test("permite atualizar apenas a publicação", () => {
  assert.deepEqual(parseAdminScriptFields({ active: false }, { partial: true }), { data: { active: false } });
  assert.match(parseAdminScriptFields({}, { partial: true }).error ?? "", /ao menos um campo/);
});
