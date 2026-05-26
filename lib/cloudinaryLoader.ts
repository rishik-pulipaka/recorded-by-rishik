export type GalleryImage = {
  id: string;
  src: string;
  full: string;
  width: number;
  height: number;
};

type LoaderArgs = { src: string; width: number };

export function cloudinaryLoader({ src, width }: LoaderArgs): string {
  return src.replace("/upload/", `/upload/f_auto,q_auto:best,w_${width}/`);
}
