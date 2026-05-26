import Title from "@/app/components/Title";
import GalleryGrid from "@/app/components/GalleryGrid";
import { getGalleryImages } from "@/lib/cloudinary";

export const revalidate = 3600;

export default async function PortraitGallery() {
  const items = await getGalleryImages("portraits");
  return (
    <div>
      <Title text="portraits" />
      <GalleryGrid items={items} />
    </div>
  );
}
