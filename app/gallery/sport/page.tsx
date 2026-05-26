import Title from "@/app/components/Title";
import GalleryGrid from "@/app/components/GalleryGrid";
import { getGalleryImages } from "@/lib/cloudinary";

export const revalidate = 3600;

export default async function SportGallery() {
  const items = await getGalleryImages("sport");
  return (
    <div>
      <Title text="sports" />
      <GalleryGrid items={items} />
    </div>
  );
}
