import { join } from "node:path";
import { clearFolder, listImages, uploadOne } from "./_upload-helpers.mjs";

// public/images/<local> -> cloudinary folder name (used by getGalleryImages)
const FOLDER_MAP = {
  portraits: "portraits",
  action: "sport",
  cars: "cars",
  wildlife: "wildlife",
  architecture: "architecture",
};

// Covers to seed into each category folder with the "cover" tag (used by getCover).
const COVERS = [
  { file: "DSC_0454_result.webp", folder: "portraits" },
  { file: "IMG_8878-2_result.webp", folder: "sport" },
  { file: "DSC_0815.jpg", folder: "wildlife" },
  { file: "ferrari_badge.png", folder: "cars" },
];

async function migrateFolder(localDir, cloudFolder) {
  const images = await listImages(localDir);
  if (images === null) {
    console.log(`(skip) no local dir: ${localDir}`);
    return;
  }
  console.log(`\n-> ${localDir}  ->  cloudinary:${cloudFolder}  (${images.length} images)`);
  await clearFolder(cloudFolder);
  let i = 0;
  for (const file of images) {
    i++;
    const full = join(localDir, file);
    try {
      const res = await uploadOne(full, cloudFolder);
      const suffix = res._resized ? ` (resized ${res._mode})` : "";
      console.log(`   [${i}/${images.length}] ${file}  ok${suffix}`);
    } catch (e) {
      console.error(`   [${i}/${images.length}] ${file}  FAIL  ${e.message || e}`);
    }
  }
}

async function migrateCovers(coversDir) {
  console.log(`\n-> seeding covers (tagged "cover")`);
  for (const { file, folder } of COVERS) {
    const full = join(coversDir, file);
    try {
      const res = await uploadOne(full, folder, ["cover"]);
      const suffix = res._resized ? ` (resized ${res._mode})` : "";
      console.log(`   ${file}  ->  cloudinary:${folder}  ok${suffix}`);
    } catch (e) {
      console.error(`   ${file}  ->  cloudinary:${folder}  FAIL  ${e.message || e}`);
    }
  }
}

const root = "public/images";
for (const [local, cloud] of Object.entries(FOLDER_MAP)) {
  await migrateFolder(join(root, local), cloud);
}
await migrateCovers(join(root, "covers"));
console.log("\nDone.");
