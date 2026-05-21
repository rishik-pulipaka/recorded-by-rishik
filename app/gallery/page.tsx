import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import portraitsImg from "../../public/images/covers/DSC_0454_result.webp";
import sportImg from "../../public/images/covers/IMG_8878-2_result.webp";
import wildlifeImg from "../../public/images/covers/DSC_0815.jpg";
import carImg from "../../public/images/covers/ferrari_badge.png";

export const metadata: Metadata = {
  title: "Gallery | Recorded by Rishik",
  description: "Browse portrait, sports, wildlife, and car photography by Rishik Pulipaka.",
};

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

const CATEGORIES = [
  { src: portraitsImg, label: "Portraits", href: "/gallery/portraits", position: "object-[center_57%]" },
  { src: sportImg, label: "Sports", href: "/gallery/sport", position: "object-[center_67%]" },
  { src: wildlifeImg, label: "Wildlife", href: "/gallery/wildlife", position: "object-center" },
  { src: carImg, label: "Cars", href: "/gallery/cars", position: "object-[center_54%]" },
];

export default function GalleryPage() {
  return (
    <div className={`text-secondary ${mono.className}`}>

      {/* Header */}
      <div className="pt-32 pb-10 px-4 text-center">
        <p className={`text-xs tracking-[5px] text-white/40 mb-3 ${mono.className}`}>PORTFOLIO</p>
        <h1 className={`text-4xl sm:text-5xl ${bold.className}`}>Gallery</h1>
      </div>

      {/* 2×2 grid */}
      <div className="px-4 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map(({ src, label, href, position }) => (
            <Link
              key={label}
              href={href}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl"
            >
              <Image
                src={src}
                alt={label}
                fill
                loading="lazy"
                quality={90}
                className={`object-cover ${position} transition-transform duration-500 group-hover:scale-105`}
                sizes="(max-width: 640px) 50vw, 40vw"
              />
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
