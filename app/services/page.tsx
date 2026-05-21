import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { PACKAGES, ADDONS, SHOOT_TYPES } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Services & Pricing",
  description:
    "Transparent, affordable photography pricing — headshots, modeling, and group sessions. Get an instant quote online.",
};

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

const FAQS = [
  {
    q: "How far in advance should I book?",
    a: "I recommend at least 1–2 weeks for most sessions. I do accept short-notice bookings when my calendar allows.",
  },
  {
    q: "What is included in the price?",
    a: "All packages include the shoot, culling, and full editing of the included photos. Travel fees may apply depending on distance — see below.",
  },
  {
    q: "Do you charge travel fees?",
    a: "Travel fees may apply depending on your location. I'll confirm any travel costs with you before the session — there are no surprise charges. Use the instant quote to get a starting estimate.",
  },
  {
    q: "How do I receive my photos?",
    a: "Edited photos are delivered via an online gallery link (Google Drive or Pixieset). You'll receive a download link with full-resolution files.",
  },
  {
    q: "What if I need to reschedule?",
    a: "Life happens. Reschedules with 48+ hours notice are free. Same-day cancellations may incur a fee.",
  },
];

// Group packages by shoot type for display
const grouped = SHOOT_TYPES.map((type) => ({
  ...type,
  packages: PACKAGES.filter((p) => p.shootType === type.id),
}));

export default function ServicesPage() {
  return (
    <div className={`text-secondary ${mono.className}`}>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 px-4 text-center">
        <p className={`text-xs tracking-[5px] text-white/40 mb-3 ${mono.className}`}>SERVICES & PRICING</p>
        <h1 className={`text-4xl sm:text-5xl ${bold.className} mb-4`}>
          Simple, Transparent Pricing
        </h1>
        <p className="text-white/60 max-w-xl mx-auto">
          No hidden fees. Every package includes professional editing. Choose
          what fits your needs and get an instant quote.
        </p>
      </section>

      {/* ── Packages grouped by type ──────────────────────────────────── */}
      {grouped.map((type, gi) => (
        <section
          key={type.id}
          className={`py-16 px-4 ${gi % 2 === 1 ? "bg-stone-950/50" : ""}`}
        >
          <div className="max-w-5xl mx-auto">
            {/* Section header */}
            <div className="mb-8 flex items-center gap-3">
              <span className="text-2xl">{type.emoji}</span>
              <div>
                <h2 className={`text-xl ${semibold.className}`}>{type.name}</h2>
                <p className="text-white/40 text-sm">{type.description}</p>
              </div>
            </div>

            {/* Package cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {type.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative border rounded-xl p-7 flex flex-col gap-4 transition-colors ${
                    "popular" in pkg && pkg.popular
                      ? "border-white/40 bg-white/5"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  {"popular" in pkg && pkg.popular && (
                    <span className="absolute -top-3 left-6 bg-white text-black text-xs px-3 py-0.5 rounded-full tracking-[1px] font-semibold">
                      MOST POPULAR
                    </span>
                  )}
                  <div>
                    <p className={`text-lg ${semibold.className}`}>{pkg.name}</p>
                    <p className="text-white/50 text-sm mt-1">{pkg.description}</p>
                  </div>
                  <div className="border-t border-white/10 pt-4 flex items-end justify-between">
                    <div>
                      <p className={`text-3xl ${bold.className}`}>${pkg.price}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {"pricePerPerson" in pkg && pkg.pricePerPerson
                          ? "per person"
                          : `${pkg.photos} edited photos`}
                      </p>
                    </div>
                    {"pricePerPerson" in pkg && pkg.pricePerPerson ? (
                      <p className="text-xs text-white/30">{pkg.photos}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Fine print */}
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <p className="text-white/30 text-xs">
          * Travel fees may apply depending on your location and will be confirmed before the session.
          Group session totals depend on the number of attendees.
        </p>
      </div>

      {/* ── Add-ons ──────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-stone-950/50">
        <div className="max-w-5xl mx-auto">
          <h2 className={`text-sm tracking-[4px] text-white/40 mb-10 ${mono.className}`}>ADD-ONS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ADDONS.map((addon) => (
              <div
                key={addon.id}
                className="border border-white/10 rounded-xl p-6 flex items-center justify-between hover:border-white/25 transition-colors"
              >
                <div>
                  <p className={`${semibold.className}`}>{addon.name}</p>
                  <p className="text-sm text-white/50 mt-0.5">{addon.detail}</p>
                </div>
                <p className={`text-xl ${bold.className} ml-6 shrink-0`}>+${addon.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-sm tracking-[4px] text-white/40 mb-10 ${mono.className}`}>FAQ</h2>
          <div className="flex flex-col divide-y divide-white/10">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="py-6">
                <p className={`${semibold.className} mb-3`}>{q}</p>
                <p className="text-white/60 leading-relaxed text-sm">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 text-center bg-stone-950/50">
        <div className="max-w-xl mx-auto flex flex-col items-center gap-5">
          <h2 className={`text-3xl ${bold.className}`}>Ready to book?</h2>
          <p className="text-white/60">
            Get an instant quote tailored to your shoot in under 2 minutes.
          </p>
          <Link
            href="/book"
            className={`px-10 py-4 bg-white text-black rounded-lg text-sm hover:bg-stone-100 transition-colors ${semibold.className} tracking-[2px]`}
          >
            Get Instant Quote →
          </Link>
          <p className="text-white/30 text-xs">
            Or{" "}
            <Link href="/contact" className="underline hover:text-white/60 transition-colors">
              send me a message
            </Link>{" "}
            if you have questions first.
          </p>
        </div>
      </section>

    </div>
  );
}
