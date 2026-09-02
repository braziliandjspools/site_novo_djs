import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID ?? "";
const folderId = url.match(/[-\w]{25,}/)?.[0];
const key = process.env.GOOGLE_DRIVE_API_KEY ?? "";

console.log("folderId:", folderId);
console.log("hasApiKey:", Boolean(key));

async function listChildren(id, indent = "") {
  if (!key) {
    console.log("No API key — using fetch to public HTML only");
    return;
  }
  const params = new URLSearchParams({
    q: `'${id}' in parents and trashed=false`,
    fields: "files(id,name,mimeType)",
    pageSize: "100",
    key,
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
  const data = await res.json();
  if (data.error) {
    console.log(indent, "API error:", data.error.message);
    return;
  }
  for (const f of data.files ?? []) {
    const isFolder = f.mimeType === "application/vnd.google-apps.folder";
    console.log(`${indent}${isFolder ? "📁" : "🎵"} ${f.name} (${f.id})`);
    if (isFolder) await listChildren(f.id, indent + "  ");
  }
}

async function testPlaylists() {
  const { getMusicProducerPlaylists } = await import("../app/lib/google-drive.ts");
  const playlists = await getMusicProducerPlaylists();
  console.log("\nPlaylists:", playlists.length);
  for (const p of playlists) {
    console.log(`- ${p.name}: ${p.tracks.length} faixas (${p.id})`);
  }
}

await listChildren(folderId);
await testPlaylists();
