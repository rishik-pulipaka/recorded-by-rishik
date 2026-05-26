import Title from "@/app/components/Title";
import GalleryGrid from "@/app/components/GalleryGrid";
import { getGalleryImages } from "@/lib/cloudinary";

export const revalidate = 3600;

export default async function CarsGallery() {
  const items = await getGalleryImages("cars");
  return (
    <div>
      <Title text="cars" />
      <GalleryGrid items={items} />
    </div>
  );
}
