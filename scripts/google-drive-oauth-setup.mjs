/**
 * Gera GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN (escopo drive.readonly).
 *
 * Uso:
 *   set GOOGLE_DRIVE_OAUTH_CLIENT_ID=...
 *   set GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=...
 *   node scripts/google-drive-oauth-setup.mjs
 *
 * Abra a URL no navegador (conta dona do Drive VIP), autorize,
 * cole o ?code=... da URL de redirect (http://localhost:8765).
 */
import http from "node:http";
import { URL } from "node:url";

const clientId = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_DRIVE_OAUTH_CLIENT_SECRET?.trim();
const redirectUri = "http://localhost:8765";
const scope = "https://www.googleapis.com/auth/drive.readonly";

if (!clientId || !clientSecret) {
  console.error("Defina GOOGLE_DRIVE_OAUTH_CLIENT_ID e GOOGLE_DRIVE_OAUTH_CLIENT_SECRET.");
  process.exit(1);
}

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", clientId);
authUrl.searchParams.set("redirect_uri", redirectUri);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", scope);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");

console.log("\n1) Abra esta URL no navegador (conta dona do Drive):\n");
console.log(authUrl.toString());
console.log("\n2) Após autorizar, o script captura o code em", redirectUri, "\n");

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || "/", redirectUri);
    const code = reqUrl.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Code ausente.");
      return;
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const json = await tokenRes.json();
    if (!tokenRes.ok || !json.refresh_token) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(json, null, 2));
      console.error("Falha ao obter refresh_token:", json);
      server.close();
      return;
    }

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OK — volte ao terminal e copie o refresh token.");
    console.log("\nAdicione no Dokploy / .env:\n");
    console.log(`GOOGLE_DRIVE_OAUTH_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_DRIVE_OAUTH_CLIENT_SECRET=${clientSecret}`);
    console.log(`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN=${json.refresh_token}`);
    console.log("");
    server.close();
    process.exit(0);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end("erro");
    server.close();
    process.exit(1);
  }
});

server.listen(8765, "127.0.0.1");
