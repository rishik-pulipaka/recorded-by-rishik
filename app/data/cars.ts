import Car1 from "../../public/images/cars/DSC_0486_result.webp";
import Car2 from "../../public/images/cars/DSC_0490_result.webp";
import Car3 from "../../public/images/cars/DSC_0498_result.webp";
import Car4 from "../../public/images/cars/DSC_0654_result.webp";
import Car5 from "../../public/images/cars/DSC_0655_result.webp";
import Car6 from "../../public/images/cars/DSC_0662_result.webp";
import Car7 from "../../public/images/cars/DSC_0712_result.webp";
import Car8 from "../../public/images/cars/DSC_0714_result.webp";
import Car9 from "../../public/images/cars/DSC_0717_result.webp";
import Car10 from "../../public/images/cars/DSC_0738_result.webp";
import Car11 from "../../public/images/cars/DSC_0743_result.webp";
import Car12 from "../../public/images/cars/DSC_0745_result.webp";
import Car13 from "../../public/images/cars/DSC_0894_result.webp";
import Car14 from "../../public/images/cars/DSC_0900_result.webp";
import Car15 from "../../public/images/cars/DSC_0989_result.webp";
import Car16 from "../../public/images/cars/DSC_0997_1_result.webp";
import Car17 from "../../public/images/cars/DSC_0997_result.webp";
import Car18 from "../../public/images/cars/DSC_1090_result.webp";
import Car19 from "../../public/images/cars/DSC_1157_result.webp";
import Car20 from "../../public/images/cars/DSC_1206_result.webp";

import { StaticImageData } from "next/image";

type CarItem = {
    image: StaticImageData;
    title: string;
};

const carItems: CarItem[] = [
    { image: Car3 , title: "Car Image 3" },
    { image: Car6 , title: "Car Image 6" },
    { image: Car17 , title: "Car Image 17" },
    { image: Car4 , title: "Car Image 4" },
    { image: Car13 , title: "Car Image 13" },
    { image: Car5 , title: "Car Image 5" },
    { image: Car11 , title: "Car Image 11" },
    { image: Car12 , title: "Car Image 12" },
    { image: Car8 , title: "Car Image 8" },
    { image: Car10 , title: "Car Image 10" },
    { image: Car9 , title: "Car Image 9" },
    { image: Car16 , title: "Car Image 16" },
    { image: Car2 , title: "Car Image 2" },
    { image: Car14 , title: "Car Image 14" },
    { image: Car15 , title: "Car Image 15" },
    { image: Car18 , title: "Car Image 18" },
    { image: Car1 , title: "Car Image 1" },
    { image: Car19 , title: "Car Image 19" },
    { image: Car7 , title: "Car Image 7" },
    { image: Car20 , title: "Car Image 20" },
];


export { carItems };
export type { CarItem };

