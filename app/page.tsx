import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import coverImg from "../public/images/covers/DSC_0800.jpg"

const montserratFont = Montserrat({
  subsets: ["latin"],
  weight: "400",
});

export default function HomePage() {
  return (
    <div className={`relative text-secondary ${montserratFont.className}`}>
      <div className="flex relative flex-col justify-center items-center px-20 py-96 w-full text-center min-h-[1000px] max-md:px-5 max-md:py-24 max-md:max-w-full">
        <Image 
          loading="lazy"
          alt="Cover Image"
          src={coverImg}
          className="object-cover absolute inset-0 size-full"
        />
<div className="z-30 flex relative flex-col mb-0 ml-9 max-w-full w-[629px] max-md:mb-2.5">
          <div className="text-2xl tracking-[14.4px] max-md:max-w-full lg:text-4xl">
            where <b>memories</b> meet <b>masterpieces</b>
          </div>
          <Link href="/gallery" className='self-center'>
            <div className={`self-center p-4 mt-8 max-w-full text-xl rounded-xl bg-stone-500/50 tracking-[2.8px] w-[200px] hover:scale-110 ease-in-out duration-200 ${montserratFont.className}`}>
                gallery →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
