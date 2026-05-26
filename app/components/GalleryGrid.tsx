"use client";

import { useEffect } from "react";
import Image from "next/image";
import Masonry from "react-masonry-css";

import LightGallery from "lightgallery/react";
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-zoom.css";
import "lightgallery/css/lg-thumbnail.css";
import lgThumbnail from "lightgallery/plugins/thumbnail";
import lgZoom from "lightgallery/plugins/zoom";

import { cloudinaryLoader, type GalleryImage } from "@/lib/cloudinaryLoader";

export default function GalleryGrid({ items }: { items: GalleryImage[] }) {
  useEffect(() => {
    const disableContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", disableContextMenu);
    return () => {
      document.removeEventListener("contextmenu", disableContextMenu);
    };
  }, []);

  if (items.length === 0) {
    return (
      <p className="text-center text-white/40 py-20">
        No photos yet — check back soon.
      </p>
    );
  }

  return (
    <div id="photos-container" className="p-5">
      <LightGallery
        speed={500}
        plugins={[lgThumbnail, lgZoom]}
        selector=".lightgallery-item"
        download={false}
      >
        <Masonry
          breakpointCols={{ default: 4, 1100: 3, 768: 2, 500: 1 }}
          className="flex gap-2"
          columnClassName=""
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={item.full}
              data-src={item.full}
              className="lightgallery-item block my-2"
            >
              <Image
                loader={cloudinaryLoader}
                src={item.src}
                alt=""
                width={item.width}
                height={item.height}
                sizes="(max-width: 500px) 100vw, (max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"
                className="w-full h-auto rounded-lg shadow"
                loading="lazy"
              />
            </a>
          ))}
        </Masonry>
      </LightGallery>
    </div>
  );
}
