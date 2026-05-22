import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

export const metadata: Metadata = { title: "My Bookings — Recorded by Rishik" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

const STATUS_COLOR: Record<string, string> = {
  pending_confirmation: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  deposit_paid: "text-green-400 bg-green-400/10 border-green-400/20",
  completed: "text-white/60 bg-white/5 border-white/10",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  archived: "text-white/30 bg-white/3 border-white/8",
};

type ClientBooking = {
  id: string;
  shoot_type: string;
  start_time: string;
  status: string;
  quote_total: number;
  location: string;
};

async function getMyBookings(): Promise<ClientBooking[] | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    const res = await fetch(`${API}/api/v1/me/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const bookings = await getMyBookings();

  const upcoming = bookings?.filter((b) =>
    !["completed", "cancelled", "archived"].includes(b.status) &&
    new Date(b.start_time) >= new Date()
  ) ?? [];
  const past = bookings?.filter((b) =>
    ["completed", "cancelled", "archived"].includes(b.status) ||
    new Date(b.start_time) < new Date()
  ) ?? [];

  return (
    <div className={`min-h-screen bg-primary text-secondary px-6 py-10 ${mono.className}`}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs tracking-[4px] text-white/40 mb-1">PORTAL</p>
            <h1 className={`text-3xl ${bold.className}`}>My Bookings</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/profile"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25 text-white/50 hover:text-white transition-all"
            >
              Profile
            </Link>
            <Link
              href="/book"
              className="text-xs px-3 py-1.5 rounded-lg bg-white text-black hover:bg-white/90 transition-colors"
            >
              + New booking
            </Link>
          </div>
        </div>

        {!bookings ? (
          <div className="border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
            Could not load your bookings. Try again in a moment.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Upcoming */}
            <section>
              <p className="text-xs tracking-[4px] text-white/40 mb-3">UPCOMING</p>
              {upcoming.length === 0 ? (
                <div className="border border-white/10 rounded-xl p-8 text-center text-white/30 text-sm">
                  No upcoming shoots.{" "}
                  <Link href="/book" className="text-white/60 underline">Book one now →</Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {upcoming.map((b) => (
                    <Link
                      key={b.id}
                      href={`/dashboard/bookings/${b.id}`}
                      className="border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/25 hover:bg-white/3 transition-all"
                    >
                      <div>
                        <p className={`text-sm ${semibold.className}`}>{b.shoot_type}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {formatDate(b.start_time)} · {b.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className={`text-sm ${semibold.className}`}>${b.quote_total}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLOR[b.status] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                          {b.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-white/20">›</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Past */}
            {past.length > 0 && (
              <section>
                <p className="text-xs tracking-[4px] text-white/40 mb-3">PAST</p>
                <div className="flex flex-col gap-2">
                  {past.map((b) => (
                    <Link
                      key={b.id}
                      href={`/dashboard/bookings/${b.id}`}
                      className="border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/25 hover:bg-white/3 transition-all opacity-70"
                    >
                      <div>
                        <p className={`text-sm ${semibold.className}`}>{b.shoot_type}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {formatDate(b.start_time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm">${b.quote_total}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLOR[b.status] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                          {b.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-white/20">›</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
