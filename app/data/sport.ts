import Sport1 from "../../public/images/action/IMG_8714_result.webp"
import Sport2 from "../../public/images/action/IMG_8751_result.webp"
import Sport3 from "../../public/images/action/IMG_8792_result.webp"
import Sport4 from "../../public/images/action/IMG_8827_result.webp"
import Sport5 from "../../public/images/action/IMG_8862_result.webp"
import Sport6 from "../../public/images/action/IMG_8878-2_result.webp"
import Sport7 from "../../public/images/action/IMG_8907_result.webp"
import Sport8 from "../../public/images/action/IMG_8990_result.webp"
import Sport9 from "../../public/images/action/IMG_9019_result.webp"
import Sport10 from "../../public/images/action/IMG_9029_result.webp"
import Sport11 from "../../public/images/action/IMG_9039_result.webp"
import Sport12 from "../../public/images/action/IMG_9059_result.webp"
import Sport13 from "../../public/images/action/IMG_9121_result.webp"
import Sport14 from "../../public/images/action/IMG_9135_result.webp"
import Sport15 from "../../public/images/action/IMG_9160_result.webp"
import Sport16 from "../../public/images/action/IMG_9170_result.webp"
import Sport17 from "../../public/images/action/IMG_9183_result.webp"
import Sport18 from "../../public/images/action/IMG_9232_result.webp"
import Sport19 from "../../public/images/action/IMG_9615_result.webp"
import Sport20 from "../../public/images/action/IMG_9663_result.webp"
import Sport21 from "../../public/images/action/IMG_9756_result.webp"
import Sport22 from "../../public/images/action/action_image_2_result.webp"
import Sport23 from "../../public/images/action/action_image_result.webp"

import { StaticImageData } from "next/image";

type SportItem = {
    image: StaticImageData;
    title: string;
};

const sportItems: SportItem[] = [
  { image: Sport11, title: "Sport Image 11" },
  { image: Sport20, title: "Sport Image 20" },
  { image: Sport4, title: "Sport Image 4" },
  { image: Sport7, title: "Sport Image 7" },
  { image: Sport14, title: "Sport Image 14" },
  { image: Sport9, title: "Sport Image 9" },
  { image: Sport23, title: "Sport Image 23" },
  { image: Sport1, title: "Sport Image 1" },
  { image: Sport15, title: "Sport Image 15" },
  { image: Sport22, title: "Sport Image 22" },
  { image: Sport17, title: "Sport Image 17" },
  { image: Sport5, title: "Sport Image 5" },
  { image: Sport18, title: "Sport Image 18" },
  { image: Sport3, title: "Sport Image 3" },
  { image: Sport2, title: "Sport Image 2" },
  { image: Sport13, title: "Sport Image 13" },
  { image: Sport6, title: "Sport Image 6" },
  { image: Sport8, title: "Sport Image 8" },
  { image: Sport10, title: "Sport Image 10" },
  { image: Sport12, title: "Sport Image 12" },
  { image: Sport19, title: "Sport Image 19" },
  { image: Sport21, title: "Sport Image 21" },
  { image: Sport16, title: "Sport Image 16" },
];


export { sportItems };
export type { SportItem };

