import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { getCover } from "@/lib/cloudinary";

export const metadata: Metadata = {
  title: "Gallery | Recorded by Rishik",
  description: "Browse portrait, sports, wildlife, and car photography by Rishik Pulipaka.",
};

export const revalidate = 3600;

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type Category = {
  label: string;
  href: string;
  folder: string;
};

const CATEGORIES: Category[] = [
  { label: "Portraits", href: "/gallery/portraits", folder: "portraits" },
  { label: "Sports", href: "/gallery/sport", folder: "sport" },
  { label: "Wildlife", href: "/gallery/wildlife", folder: "wildlife" },
  { label: "Cars", href: "/gallery/cars", folder: "cars" },
];

export default async function GalleryPage() {
  const covers = await Promise.all(
    CATEGORIES.map(async (c) => ({ ...c, src: await getCover(c.folder) }))
  );

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="pt-32 pb-10 px-4 text-center">
        <p className={`text-xs tracking-[5px] text-white/40 mb-3 ${mono.className}`}>PORTFOLIO</p>
        <h1 className={`text-4xl sm:text-5xl ${bold.className}`}>Gallery</h1>
      </div>

      <div className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {covers.map(({ src, label, href }) => (
            <Link
              key={label}
              href={href}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-white/5"
            >
              {src && (
                <Image
                  src={src}
                  alt={label}
                  fill
                  unoptimized
                  loading="lazy"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 40vw"
                />
              )}
              <div className="absolute inset-0 bg-black/45 group-hover:bg-black/25 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg sm:text-2xl tracking-[6px] ${semibold.className}`}>
                  {label.toUpperCase()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
