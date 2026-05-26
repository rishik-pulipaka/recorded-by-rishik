import { v2 as cloudinary } from "cloudinary";
import type { GalleryImage } from "./cloudinaryLoader";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

type SearchResource = {
  public_id: string;
  width: number;
  height: number;
};

function folderExpression(folder: string): string {
  return `folder="${folder}" OR asset_folder="${folder}"`;
}

export async function getGalleryImages(folder: string): Promise<GalleryImage[]> {
  try {
    const res = await cloudinary.search
      .expression(folderExpression(folder))
      .sort_by("created_at", "desc")
      .max_results(500)
      .execute();
    const resources = (res.resources ?? []) as SearchResource[];
    return resources.map((r) => ({
      id: r.public_id,
      src: cloudinary.url(r.public_id, { secure: true }),
      full: cloudinary.url(r.public_id, {
        secure: true,
        transformation: [
          { width: 2400, crop: "limit", quality: "auto:best", fetch_format: "auto" },
        ],
      }),
      width: r.width,
      height: r.height,
    }));
  } catch (err) {
    console.error(`Cloudinary search failed for folder "${folder}":`, err);
    return [];
  }
}

export async function getHero(): Promise<string | null> {
  try {
    const tagged = await cloudinary.search
      .expression("tags=hero")
      .max_results(100)
      .execute();
    let pool = (tagged.resources ?? []) as SearchResource[];
    if (pool.length === 0) {
      const galleries = ["portraits", "sport", "cars", "wildlife"];
      const expr = galleries
        .map((f) => `folder="${f}" OR asset_folder="${f}"`)
        .join(" OR ");
      const fallback = await cloudinary.search
        .expression(expr)
        .max_results(200)
        .execute();
      pool = (fallback.resources ?? []) as SearchResource[];
    }
    if (pool.length === 0) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return cloudinary.url(pick.public_id, {
      secure: true,
      transformation: [
        { width: 2400, crop: "limit", quality: "auto:best", fetch_format: "auto" },
      ],
    });
  } catch (err) {
    console.error("Cloudinary hero lookup failed:", err);
    return null;
  }
}

export async function getCover(folder: string): Promise<string | null> {
  try {
    const tagged = await cloudinary.search
      .expression(`(${folderExpression(folder)}) AND tags=cover`)
      .max_results(1)
      .execute();
    let r = tagged.resources?.[0] as SearchResource | undefined;
    if (!r) {
      const newest = await cloudinary.search
        .expression(folderExpression(folder))
        .sort_by("created_at", "desc")
        .max_results(1)
        .execute();
      r = newest.resources?.[0] as SearchResource | undefined;
    }
    if (!r) return null;
    return cloudinary.url(r.public_id, {
      secure: true,
      transformation: [
        {
          width: 1200,
          height: 900,
          crop: "fill",
          gravity: "auto",
          quality: "auto:best",
          fetch_format: "auto",
        },
      ],
    });
  } catch (err) {
    console.error(`Cloudinary cover lookup failed for folder "${folder}":`, err);
    return null;
  }
}
