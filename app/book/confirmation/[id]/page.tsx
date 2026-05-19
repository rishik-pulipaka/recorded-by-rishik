import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

export const metadata: Metadata = { title: "Booking Submitted" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

const NEXT_STEPS = [
  {
    icon: "📬",
    title: "Check your email",
    description: "A confirmation email is on its way with your booking summary.",
  },
  {
    icon: "✅",
    title: "Rishik reviews and confirms",
    description: "You'll hear back within 24 hours to lock in your session.",
  },
  {
    icon: "📅",
    title: "Calendar invite sent",
    description: "Once confirmed, a Google Calendar invite goes to your inbox.",
  },
  {
    icon: "📸",
    title: "Show up and create",
    description: "On the day, just bring yourself — I handle everything else.",
  },
];

export default async function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isDemo = id === "demo";

  return (
    <div className={`min-h-screen text-secondary ${mono.className}`}>
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-20 text-center flex flex-col items-center gap-8">

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl">
          📸
        </div>

        {/* Heading */}
        <div>
          <p className="text-xs tracking-[5px] text-white/40 mb-3">BOOKING REQUEST</p>
          <h1 className={`text-4xl sm:text-5xl ${bold.className} mb-4`}>
            You&apos;re all set!
          </h1>
          <p className="text-white/60 max-w-md mx-auto leading-relaxed">
            Your booking request has been submitted. I&apos;m excited to work with you —
            look out for a confirmation email within 24 hours.
          </p>
          {isDemo && (
            <p className="text-amber-400/70 text-xs mt-3">
              (Demo mode — backend not connected yet. Your email would be sent once deployed.)
            </p>
          )}
        </div>

        {/* Reference */}
        {!isDemo && (
          <div className="border border-white/10 rounded-xl px-8 py-4 text-center">
            <p className="text-xs text-white/30 tracking-[3px] mb-1">BOOKING REFERENCE</p>
            <p className="text-sm font-mono text-white/70">{id}</p>
          </div>
        )}

        {/* What happens next */}
        <div className="w-full text-left mt-4">
          <p className={`text-xs tracking-[4px] text-white/40 mb-6 text-center ${mono.className}`}>
            WHAT HAPPENS NEXT
          </p>
          <div className="flex flex-col gap-4">
            {NEXT_STEPS.map((step, i) => (
              <div key={i} className="flex gap-5 p-5 border border-white/10 rounded-xl hover:border-white/20 transition-colors">
                <span className="text-2xl shrink-0">{step.icon}</span>
                <div>
                  <p className={`${semibold.className} mb-1`}>{step.title}</p>
                  <p className="text-sm text-white/50">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 w-full mt-2">
          <Link
            href="/dashboard"
            className={`flex-1 py-4 rounded-lg bg-white text-black text-sm hover:bg-stone-100 transition-colors ${semibold.className} tracking-[1px] text-center`}
          >
            View My Bookings
          </Link>
          <Link
            href="/"
            className="flex-1 py-4 rounded-lg border border-white/20 text-sm hover:bg-white/5 transition-colors text-center"
          >
            Back to Home
          </Link>
        </div>

        {/* Contact */}
        <p className="text-sm text-white/30">
          Questions?{" "}
          <Link href="/contact" className="underline hover:text-white/60 transition-colors">
            Send me a message
          </Link>
        </p>
      </div>
    </div>
  );
}
