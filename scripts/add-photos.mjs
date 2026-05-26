import { stat } from "node:fs/promises";
import { join } from "node:path";
import { listImages, uploadOne } from "./_upload-helpers.mjs";

const [, , sourceArg, folderArg] = process.argv;

const ALLOWED_FOLDERS = ["portraits", "sport", "cars", "wildlife", "architecture"];

if (!sourceArg || !folderArg) {
  console.error("Usage: npm run add-photos -- <source-path> <gallery-name>");
  console.error("Example: npm run add-photos -- ./new-shoot portraits");
  console.error("         npm run add-photos -- ./IMG_1234.jpg wildlife");
  console.error(`gallery-name must be one of: ${ALLOWED_FOLDERS.join(", ")}`);
  process.exit(1);
}

if (!ALLOWED_FOLDERS.includes(folderArg)) {
  console.error(`Unknown gallery "${folderArg}". Must be one of: ${ALLOWED_FOLDERS.join(", ")}`);
  process.exit(1);
}

const info = await stat(sourceArg).catch(() => null);
if (!info) {
  console.error(`Path not found: ${sourceArg}`);
  process.exit(1);
}

let files;
if (info.isDirectory()) {
  const names = await listImages(sourceArg);
  files = (names ?? []).map((n) => join(sourceArg, n));
} else {
  files = [sourceArg];
}

if (files.length === 0) {
  console.log("No images found in that path.");
  process.exit(0);
}

console.log(`Adding ${files.length} image(s) to gallery "${folderArg}"...\n`);
let ok = 0, fail = 0;
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  try {
    const res = await uploadOne(f, folderArg);
    const suffix = res._resized ? ` (resized ${res._mode})` : "";
    console.log(`[${i + 1}/${files.length}] ${f}  ok${suffix}`);
    ok++;
  } catch (e) {
    console.error(`[${i + 1}/${files.length}] ${f}  FAIL  ${e.message || e}`);
    fail++;
  }
}

console.log(`\nDone. ${ok} uploaded, ${fail} failed.`);
if (ok > 0) console.log("New photos will appear on the live site within an hour (or instantly after the next redeploy).");
