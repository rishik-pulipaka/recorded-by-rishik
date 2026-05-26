import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { readdir, stat, writeFile, unlink, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename, extname } from "node:path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Missing Cloudinary env vars. Run with: node --env-file=.env.local <script>");
  process.exit(1);
}

export const IMG_EXT = /\.(jpe?g|png|webp|gif|avif|tiff?|bmp|heic|heif)$/i;
const FREE_TIER_LIMIT = 10 * 1024 * 1024;
const TARGET_MAX = 9.5 * 1024 * 1024;
const MAX_DIM = 3000;

function uploadLarge(filePath, opts) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_large(filePath, opts, (err, res) =>
      err ? reject(err) : resolve(res)
    );
  });
}

async function tempPath(originalName, ext) {
  const dir = await mkdtemp(join(tmpdir(), "rps-resize-"));
  const baseNoExt = basename(originalName, extname(originalName));
  return join(dir, `${baseNoExt}${ext}`);
}

async function encode(pipeline, format, quality) {
  if (format === "webp") return { buf: await pipeline.webp({ quality }).toBuffer(), ext: ".webp" };
  if (format === "png") return { buf: await pipeline.png({ compressionLevel: 9 }).toBuffer(), ext: ".png" };
  return { buf: await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer(), ext: ".jpg" };
}

export async function ensureUnderLimit(filePath) {
  const { size } = await stat(filePath);
  if (size <= FREE_TIER_LIMIT) return { path: filePath, resized: false, cleanup: async () => {} };

  const meta = await sharp(filePath).metadata();
  const format = meta.format === "webp" || meta.format === "png" ? meta.format : "jpeg";

  const attempts = [
    { dim: MAX_DIM, q: 90 },
    { dim: MAX_DIM, q: 80 },
    { dim: 2400, q: 80 },
    { dim: 2000, q: 80 },
  ];
  for (const { dim, q } of attempts) {
    const pipeline = sharp(filePath)
      .rotate()
      .resize({ width: dim, height: dim, fit: "inside", withoutEnlargement: true });
    const { buf, ext } = await encode(pipeline, format, q);
    if (buf.length > TARGET_MAX) continue;
    const out = await tempPath(filePath, ext);
    await writeFile(out, buf);
    return {
      path: out,
      resized: true,
      mode: `${dim}px@q${q}`,
      cleanup: async () => { try { await unlink(out); } catch {} },
    };
  }
  throw new Error("could not resize under 10MB even at 2000px/q80");
}

export async function uploadOne(filePath, folder, tags = []) {
  const opts = {
    folder,
    asset_folder: folder,
    tags,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    resource_type: "image",
    chunk_size: 6 * 1024 * 1024,
  };
  const prep = await ensureUnderLimit(filePath);
  try {
    const { size } = await stat(prep.path);
    const res = size > FREE_TIER_LIMIT
      ? await uploadLarge(prep.path, opts)
      : await cloudinary.uploader.upload(prep.path, opts);
    return { ...res, _resized: prep.resized, _mode: prep.mode };
  } finally {
    await prep.cleanup();
  }
}

export async function clearFolder(folder) {
  try {
    const res = await cloudinary.search
      .expression(`folder="${folder}" OR asset_folder="${folder}"`)
      .max_results(500)
      .execute();
    const ids = (res.resources ?? []).map((r) => r.public_id);
    if (ids.length === 0) return;
    console.log(`   clearing ${ids.length} existing in ${folder}...`);
    for (let i = 0; i < ids.length; i += 100) {
      await cloudinary.api.delete_resources(ids.slice(i, i + 100));
    }
  } catch (e) {
    console.warn(`   could not clear ${folder}: ${e.message || e}`);
  }
}

export async function listImages(dir) {
  try {
    const entries = await readdir(dir);
    return entries.filter((f) => IMG_EXT.test(f));
  } catch {
    return null;
  }
}

export { cloudinary };
