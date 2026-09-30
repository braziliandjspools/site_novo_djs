import assert from "node:assert/strict";
import { test } from "node:test";
import { formatStyleNameForDisplay } from "./style-display";

test("separa hierarquia Traxsource só no separador com espaços", () => {
  assert.equal(
    formatStyleNameForDisplay("140 - Deep Dubstep - Grime"),
    "140/Deep Dubstep/Grime",
  );
});

test("mantém estilos simples", () => {
  assert.equal(formatStyleNameForDisplay("Afro House"), "Afro House");
  assert.equal(formatStyleNameForDisplay("Deep House"), "Deep House");
  assert.equal(formatStyleNameForDisplay("Hip Hop"), "Hip Hop");
  assert.equal(formatStyleNameForDisplay("Drum & Bass"), "Drum & Bass");
});

test("não mexe em hífen sem espaços nem duplica barra", () => {
  assert.equal(formatStyleNameForDisplay("Deep-House"), "Deep-House");
  assert.equal(formatStyleNameForDisplay("140/Deep Dubstep/Grime"), "140/Deep Dubstep/Grime");
  assert.equal(formatStyleNameForDisplay("  "), "");
});
