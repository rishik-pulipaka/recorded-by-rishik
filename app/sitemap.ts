import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://recordedbyrishik.com";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/gallery/portraits`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery/wildlife`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery/sport`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery/cars`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery/architecture`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
  ];
}
