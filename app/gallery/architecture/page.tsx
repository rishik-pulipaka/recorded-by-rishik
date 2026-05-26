import Title from "@/app/components/Title";
import GalleryGrid from "@/app/components/GalleryGrid";
import { getGalleryImages } from "@/lib/cloudinary";

export const revalidate = 3600;

export default async function ArchitectureGallery() {
  const items = await getGalleryImages("architecture");
  return (
    <div>
      <Title text="architecture" />
      <GalleryGrid items={items} />
    </div>
  );
}
