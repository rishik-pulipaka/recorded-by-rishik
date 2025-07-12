import Title from "../components/Title";
import Link from "next/link";
import Image from "next/image";
import portraitsImg from "../../public/images/covers/DSC_0454_result.webp"
import sportImg from "../../public/images/covers/IMG_8878-2_result.webp"
import wildlifeImg from "../../public/images/covers/DSC_0815.jpg"
import carImg from "../../public/images/covers/ferrari_badge.png"
// import architectureImg from "../../public/images/action/action_image_result.webp"
import { Montserrat } from "next/font/google";

const montserratFont = Montserrat({
  subsets: ["latin"],
  weight: "400",  
})

export default function GalleryPage() {
    return (
      <div className={`${montserratFont.className}`}>
        <Title text="gallery"/>
        
        <div className="mt-10 flex flex-col w-full h-auto">
          <div id="sport-container" className="bg-primary relative w-full aspect-[16/5] hover:opacity-75 ease-in-out duration-300 overflow-hidden">
            <Link href="/gallery/sport">
              <Image 
                loading="lazy"
                src={sportImg}
                alt="sport img"
                quality={100}
                className="object-cover object-[center_67%] absolute inset-0 size-full opacity-70"
              />
              <div className="flex w-full h-full">
                <div className="w-full h-full flex justify-center items-center text-secondary text-center">
                  <h1 className="z-10 font-montserrat tracking-[5px] font-bold text-xl md:text-3xl">sports</h1>
                </div>
                <div className="w-full h-full flex justify-center items-center text-secondary text-center"></div>
              </div>
            </Link>
          </div>
          <div id="portraits-container" className="bg-primary relative w-full aspect-[16/5] md:h-1/5 hover:opacity-75 ease-in-out duration-300">
            <Link href="/gallery/portraits">
              <Image 
                loading="lazy"
                src={portraitsImg}
                alt="portraits img"
                quality={100}
                className="object-cover object-[center_57%] absolute inset-0 size-full opacity-70"
              />
              <div className="flex w-full h-full">
                <div className="w-full h-full flex justify-center items-center text-secondary text-center"></div>
                <div className="w-full h-full flex justify-center items-center text-secondary text-center">
                  <h1 className="z-10 font-montserrat tracking-[5px] font-bold text-xl md:text-3xl">portraits</h1>
                </div>
              </div>
            </Link>
          </div>
          <div id="wildlife-container" className="bg-primary relative w-full aspect-[16/5] md:h-1/5 hover:opacity-75 ease-in-out duration-300">
            <Link href="/gallery/wildlife">
              <Image 
                loading="lazy"
                src={wildlifeImg}
                alt="wildlife img"
                quality={100}
                className="object-cover absolute inset-0 size-full opacity-50"
              />
              <div className="flex w-full h-full">
                <div className="w-full h-full flex justify-center items-center text-secondary text-center">
                  <h1 className="z-10 font-montserrat tracking-[5px] font-bold text-xl md:text-3xl">wildlife</h1>
                </div>
                <div className="w-full h-full flex justify-center items-center text-secondary text-center"></div>
              </div>
            </Link>
          </div>
          <div id="cars-container" className="bg-primary relative w-full aspect-[16/5] md:h-1/5 hover:opacity-75 ease-in-out duration-300">
            <Link href="/gallery/cars">
              <Image 
                loading="lazy"
                src={carImg}
                alt="cars img"
                quality={100}
                className="object-cover object-[center_54%] absolute inset-0 size-full opacity-70"
              />
              <div className="flex w-full h-full">
                <div className="w-full h-full flex justify-center items-center text-secondary text-center"></div>
                <div className="w-full h-full flex justify-center items-center text-secondary text-center">
                  <h1 className="z-10 font-montserrat tracking-[5px] font-bold text-xl md:text-3xl">cars</h1>
                </div>
              </div>
            </Link>
          </div>
          {/* <div id="architecture-container" className="bg-primary relative w-full aspect-[16/5] md:h-1/5 hover:opacity-75 ease-in-out duration-300">
            <Link href="/gallery/architecture">
              <Image 
                loading="lazy"
                src={architectureImg}
                alt="architecture img"
                quality={100}
                className="object-cover absolute inset-0 size-full opacity-70"
              />
              <div className="flex w-full h-full">
                <div className="w-full h-full flex justify-center items-center text-secondary text-center">
                  <h1 className="z-10 font-montserrat tracking-[5px] font-bold text-xl md:text-3xl">architecture</h1>
                </div>
                <div className="w-full h-full flex justify-center items-center text-secondary text-center"></div>
              </div>
            </Link>
          </div> */}
      </div>
    </div>
    );
  }
  