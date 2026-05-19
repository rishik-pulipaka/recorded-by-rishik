"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { items } from "../data/navigation";
import { Montserrat } from "next/font/google";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "500" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isSignedIn, isLoaded } = useAuth();

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("click", handleClickOutside);
    else document.removeEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className={`bg-primary py-5 px-6 md:px-10 w-full h-[120px] flex items-center justify-between text-secondary lg:h-[151px] ${mono.className}`}
    >
      {/* Logo */}
      <Link href="/">
        <div className="flex gap-3 items-center">
          <div>
            <h1 className={`text-lg tracking-[14px] lg:text-3xl ${semibold.className}`}>
              RECORDED
            </h1>
            <h1 className={`text-lg tracking-[14.5px] lg:text-3xl ${bold.className}`}>
              BY RISHIK
            </h1>
          </div>
          <div className="shrink-0 w-[1px] border-white border-solid border-[2px] h-[70px]" />
        </div>
      </Link>

      {/* Desktop nav */}
      <div className="hidden space-x-10 text-sm tracking-[4px] lg:flex items-center">
        {items.map(({ name, link }) => (
          <Link key={name} href={link}>
            <span className="hover:opacity-60 transition-opacity duration-200">{name}</span>
          </Link>
        ))}

        {/* Auth */}
        <div className="ml-4">
          {!isLoaded ? null : isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button className="text-sm tracking-[3px] border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                sign in
              </button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative z-30 flex flex-col items-center justify-center lg:hidden"
        aria-label="Toggle menu"
      >
        <span className={`my-1 block h-0.5 w-6 rounded-sm transition-all duration-300 ${isOpen ? "translate-y-2.5 rotate-45 bg-white" : "-translate-y-0.5 bg-white"}`} />
        <span className={`my-1 block h-0.5 w-6 rounded-sm transition-all duration-300 ${isOpen ? "opacity-0" : "bg-white opacity-100"}`} />
        <span className={`my-1 block h-0.5 w-6 rounded-sm transition-all duration-300 ${isOpen ? "-translate-y-2.5 -rotate-45 bg-white" : "translate-y-0.5 bg-white"}`} />
      </button>

      {/* Mobile menu */}
      <motion.div
        initial={false}
        animate={isOpen ? "open" : "closed"}
        ref={containerRef}
        className="absolute z-20 left-0 top-0 flex h-[50vh] w-full flex-col items-center justify-center bg-primary shadow-2xl lg:hidden"
        variants={sidebarVariants}
      >
        <motion.ul className="list-none space-y-6 text-xl text-secondary">
          {items.map(({ name, link }, index) => (
            <motion.li
              key={index}
              variants={itemVariants}
              custom={index}
              initial="closed"
              animate="open"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              className="text-center tracking-[4px]"
            >
              <Link href={link} onClick={closeMenu}>{name}</Link>
            </motion.li>
          ))}
          <motion.li
            variants={itemVariants}
            custom={items.length}
            initial="closed"
            animate="open"
            className="text-center pt-2"
          >
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button
                  onClick={closeMenu}
                  className="text-sm tracking-[3px] border border-white/30 px-6 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  sign in
                </button>
              </SignInButton>
            )}
          </motion.li>
        </motion.ul>
      </motion.div>
    </div>
  );
}

const sidebarVariants = {
  open: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
  closed: { y: "-100%", opacity: 0, transition: { type: "spring", stiffness: 400, damping: 40 } },
};

const itemVariants = {
  open: (i: number) => ({
    y: 0, opacity: 1,
    transition: { delay: i * 0.05, type: "spring", stiffness: 100, damping: 15 },
  }),
  closed: { y: -30, opacity: 0 },
};
