"use client"

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { items } from "../data/navigation";
import { Montserrat } from "next/font/google";

const montserratFont = Montserrat({
  subsets: ["latin"],
  weight: "400",
});
const montserratFontSemiBold = Montserrat({
  subsets: ["latin"],
  weight: "500",
});
const montserratFontBold = Montserrat({
  subsets: ["latin"],
  weight: "800",
});

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

    return (
      <div className={`bg-primary py-5 px-10 w-full h-[120px] flex items-center justify-between text-secondary lg:h-[151px] ${montserratFont.className} `}>
        <Link href="/">
          <div className="flex gap-3">
            <div className="">
              <h1 className={`text-lg tracking-[14px] lg:text-3xl ${montserratFontSemiBold.className}`}>
                RECORDED
              </h1>
              <h1 className={`text-lg tracking-[14.5px] lg:text-3xl ${montserratFontBold.className}`}>
                BY RISHIK
              </h1>     
            </div>
            {/* Vertical line in logo */}
            <div className="shrink-0 w-[1px] border-white border-solid border-[2px] h-[70px]" />
          </div>
        </Link>

        <div className="hidden space-x-16 text-lg tracking-[6px] lg:flex">
          {items.map(({ name, link }) => (
            <Link key={name} href={link}>
              <span className="hover:scale-125 ease-in-out duration-200 p-2">
                {name}
              </span>
            </Link>
          ))}
        </div>

        {/* Hamburger -> Cross */}
      <button
        onClick={handleClick}
        className="pointer-events-auto relative z-30 flex flex-col items-center justify-center lg:hidden"
      >
        <span
          className={`my-1 block h-0.5 w-6 rounded-sm transition-all duration-300 ease-out ${
            isOpen
              ? "translate-y-2.5 rotate-45 bg-white"
              : "-translate-y-0.5 bg-white"
          }`}
        ></span>
        <span
          className={`my-1 block h-0.5 w-6 rounded-sm transition-all duration-300 ease-out ${
            isOpen ? "opacity-0" : "bg-white opacity-100"
          }`}
        ></span>
        <span
          className={`my-1 block h-0.5 w-6 rounded-sm transition-all duration-300 ease-out ${
            isOpen
              ? "-translate-y-2.5 -rotate-45 bg-white"
              : "translate-y-0.5 bg-white"
          }`}
        ></span>
      </button>
      
      <motion.div
        initial="false"
        animate={isOpen ? "open" : "closed"}
        exit="closed"
        ref={containerRef}
        className="absolute z-20 left-0 top-0 flex h-[40vh] w-full flex-col items-center justify-center bg-primary shadow-lg lg:hidden"
        variants={sidebarVariants}
      >
        <motion.ul className="list-none space-y-6 text-2xl text-secondary">
          {items.map(({ name, link }, index) => (
            <motion.li
              key={index}
              variants={itemVariants}
              initial="closed"
              animate="open"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={link}
                onClick={() => {
                  closeMenu();
                }}
              >
                {name}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      </div>
    );
  }

  const sidebarVariants = {
    open: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    },
    closed: {
      y: "-100%",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40,
      },
    },
  };
  
  const itemVariants = {
    open: (index: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: index * 1,
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    }),
    closed: {
      y: -50,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };