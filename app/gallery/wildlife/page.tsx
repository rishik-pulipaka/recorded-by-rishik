import Title from "@/app/components/Title";
import GalleryGrid from "@/app/components/GalleryGrid";
import { getGalleryImages } from "@/lib/cloudinary";

export const revalidate = 3600;

export default async function WildlifeGallery() {
  const items = await getGalleryImages("wildlife");
  return (
    <div>
      <Title text="wildlife" />
      <GalleryGrid items={items} />
    </div>
  );
}
