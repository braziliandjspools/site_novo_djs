import { config } from "dotenv";
config({ path: ".env.local" });

const raw = process.env.GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID ?? "";
const folderId = raw.match(/folders\/([a-zA-Z0-9_-]+)/)?.[1] ?? raw.trim();
const key = process.env.GOOGLE_DRIVE_API_KEY ?? "";

async function fetchHtml(folderId: string) {
  const urls = [
    `https://drive.google.com/embeddedfolderview?id=${folderId}#list`,
    `https://drive.google.com/drive/folders/${folderId}`,
  ];
  for (const url of urls) {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log(url, res.status, res.headers.get("content-type"));
    if (res.ok) return res.text();
  }
  throw new Error("fetch failed");
}

function collectFolders(html: string) {
  const folders = new Map<string, string>();
  const blocks = html.split('<div class="flip-entry"');
  for (const block of blocks.slice(1)) {
    const isFolder =
      block.includes("/drive/folders/") ||
      block.includes("drive-sprite-folder") ||
      block.includes("application/vnd.google-apps.folder");
    if (!isFolder) continue;
    const folderMatch = block.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/);
    const nameMatch = block.match(/flip-entry-title">([^<]+)</);
    if (folderMatch && nameMatch) folders.set(folderMatch[1], nameMatch[1].trim());
  }
  return folders;
}

function collectFiles(html: string) {
  const files = new Map<string, string>();
  const blocks = html.split('<div class="flip-entry"');
  for (const block of blocks.slice(1)) {
    if (block.includes("/drive/folders/") || block.includes("drive-sprite-folder")) continue;
    const idMatch = block.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ?? block.match(/id="entry-([a-zA-Z0-9_-]+)"/);
    const nameMatch = block.match(/flip-entry-title">([^<]+)</);
    if (idMatch && nameMatch && /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(nameMatch[1])) {
      files.set(idMatch[1], nameMatch[1].trim());
    }
  }
  return files;
}

async function main() {
  console.log("folderId:", folderId);
  console.log("hasApiKey:", Boolean(key));
  if (!folderId) return;

  const html = await fetchHtml(folderId);
  console.log("html length:", html.length);

  const folders = collectFolders(html);
  console.log("\nFolders at root:", folders.size);
  for (const [id, name] of folders) console.log(` 📁 ${name} (${id})`);

  const files = collectFiles(html);
  console.log("\nAudio at root:", files.size);
  for (const [id, name] of files) console.log(` 🎵 ${name}`);

  for (const [id, name] of folders) {
    console.log(`\n--- Inside ${name} ---`);
    try {
      const subHtml = await fetchHtml(id);
      const subFolders = collectFolders(subHtml);
      const subFiles = collectFiles(subHtml);
      console.log(" subfolders:", subFolders.size, "audio:", subFiles.size);
      for (const [sid, sname] of subFolders) console.log(`  📁 ${sname}`);
      for (const [, fname] of subFiles) console.log(`  🎵 ${fname}`);
    } catch (e) {
      console.log("  error:", e);
    }
  }

  process.env.GOOGLE_DRIVE_MUSIC_PRODUCER_FOLDER_ID = raw;
  if (key) process.env.GOOGLE_DRIVE_API_KEY = key;
  const { getMusicProducerPlaylists } = await import("../app/lib/google-drive");
  const playlists = await getMusicProducerPlaylists();
  console.log("\n=== getMusicProducerPlaylists ===");
  console.log("count:", playlists.length);
  for (const p of playlists) console.log(`- ${p.name}: ${p.tracks.length}`);
}

main().catch(console.error);
