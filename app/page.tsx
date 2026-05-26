import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { getCover, getHero } from "@/lib/cloudinary";

// hero rotates per visit, so render this page fresh on each request
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recorded by Rishik | Photography",
  description:
    "Professional photography in Los Angeles — portraits, headshots, modeling, and more. Book your session online and get an instant quote.",
  openGraph: {
    title: "Recorded by Rishik | Photography",
    description: "Professional photography in Los Angeles.",
    type: "website",
  },
};

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

const SERVICES = [
  {
    name: "Headshots",
    description: "Professional headshots for LinkedIn, acting portfolios, and company directories.",
    from: 65,
  },
  {
    name: "Modeling",
    description: "Individual and group modeling sessions that tell your story through light and composition.",
    from: 85,
  },
  {
    name: "Group Sessions",
    description: "Team headshots and group modeling — competitive per-person pricing for any size group.",
    from: 40,
  },
];

export default async function HomePage() {
  const [heroSrc, portraitsSrc, sportSrc, carSrc] = await Promise.all([
    getHero(),
    getCover("portraits"),
    getCover("sport"),
    getCover("cars"),
  ]);

  return (
    <div className={`text-secondary ${mono.className}`}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[100svh] text-center overflow-hidden bg-black">
        {heroSrc && (
          <Image
            src={heroSrc}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-3xl">
          <p
            className={`text-xs tracking-[6px] uppercase text-white/70 ${mono.className}`}
          >
            Los Angeles · Photography
          </p>
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl leading-tight ${bold.className}`}
          >
            where memories meet<br className="hidden sm:block" /> masterpieces
          </h1>
          <p className={`text-base sm:text-lg text-white/80 max-w-md ${mono.className}`}>
            Professional photography for the moments that matter — portraits,
            headshots, modeling, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              href="/book"
              className={`px-8 py-4 rounded-lg bg-white text-black text-sm hover:bg-stone-100 transition-colors duration-200 ${semibold.className} tracking-[2px]`}
            >
              Book a Session
            </Link>
            <Link
              href="/gallery"
              className={`px-8 py-4 rounded-lg border border-white/40 text-sm hover:bg-white/10 transition-colors duration-200 ${mono.className} tracking-[2px]`}
            >
              View Gallery
            </Link>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-bounce">
          <span className="text-xs tracking-[3px]">scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <section className="bg-stone-900/80 border-y border-white/5 py-5">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-8 text-center">
          {[
            ["50+", "Sessions completed"],
            ["Los Angeles", "Based in LA, shoot anywhere"],
            ["48h", "Standard delivery"],
            ["100%", "Satisfaction guaranteed"],
          ].map(([stat, label]) => (
            <div key={stat} className="flex flex-col items-center">
              <span className={`text-xl sm:text-2xl ${bold.className}`}>{stat}</span>
              <span className="text-xs text-white/50 tracking-[1px] mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portfolio preview ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className={`text-xs tracking-[5px] text-white/40 mb-2 ${mono.className}`}>PORTFOLIO</p>
              <h2 className={`text-3xl sm:text-4xl ${bold.className}`}>The Work</h2>
            </div>
            <Link
              href="/gallery"
              className={`hidden sm:block text-sm text-white/50 hover:text-white transition-colors tracking-[2px] ${mono.className}`}
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { src: portraitsSrc, label: "Portraits", href: "/gallery/portraits" },
              { src: sportSrc, label: "Sports", href: "/gallery/sport" },
              { src: carSrc, label: "Cars", href: "/gallery/cars" },
            ].map(({ src, label, href }) => (
              <Link
                key={label}
                href={href}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg bg-white/5"
              >
                {src && (
                  <Image
                    src={src}
                    alt={label}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-300" />
                <div className="absolute bottom-4 left-4">
                  <span className={`text-sm tracking-[4px] ${semibold.className}`}>{label.toUpperCase()}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="sm:hidden mt-6 text-center">
            <Link href="/gallery" className="text-sm text-white/50 tracking-[2px]">
              View all →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Services preview ──────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-stone-950/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className={`text-xs tracking-[5px] text-white/40 mb-2 ${mono.className}`}>SERVICES</p>
            <h2 className={`text-3xl sm:text-4xl ${bold.className}`}>How I Can Help</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICES.map(({ name, description, from }) => (
              <div
                key={name}
                className="border border-white/10 rounded-xl p-8 hover:border-white/25 transition-colors duration-300 flex flex-col gap-4"
              >
                <h3 className={`text-xl ${semibold.className}`}>{name}</h3>
                <p className="text-white/60 text-sm leading-relaxed flex-grow">{description}</p>
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-white/40 text-xs tracking-[2px]">
                    from <span className={`text-white text-lg ${bold.className}`}>${from}</span>
                  </span>
                  <Link
                    href="/services"
                    className="text-xs tracking-[2px] text-white/50 hover:text-white transition-colors"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/services"
              className={`inline-block px-8 py-3 border border-white/20 rounded-lg text-sm hover:bg-white/5 transition-colors ${mono.className} tracking-[2px]`}
            >
              See Full Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
          <p className={`text-xs tracking-[5px] text-white/40 ${mono.className}`}>LET&apos;S CREATE SOMETHING</p>
          <h2 className={`text-3xl sm:text-5xl ${bold.className} leading-tight`}>
            Ready to make<br />something beautiful?
          </h2>
          <p className="text-white/60 max-w-md">
            Get an instant quote in under 2 minutes. No commitment, no pressure.
          </p>
          <Link
            href="/book"
            className={`mt-4 px-10 py-4 rounded-lg bg-white text-black text-sm hover:bg-stone-100 transition-colors duration-200 ${semibold.className} tracking-[2px]`}
          >
            Book Your Session →
          </Link>
        </div>
      </section>

    </div>
  );
}
