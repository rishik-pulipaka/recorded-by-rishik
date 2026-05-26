import { clearFolder } from "./_upload-helpers.mjs";

const folder = process.argv[2];
if (!folder) { console.error("Usage: node clear-folder.mjs <folder>"); process.exit(1); }

console.log(`Clearing Cloudinary folder "${folder}"...`);
await clearFolder(folder);
console.log("Done.");
