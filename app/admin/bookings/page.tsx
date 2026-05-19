import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

export const metadata: Metadata = { title: "Bookings" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type Booking = {
  id: string;
  shoot_type: string;
  start_time: string;
  status: string;
  quote_total: number;
  location: string;
};

const STATUS_COLOR: Record<string, string> = {
  pending_confirmation: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  deposit_paid: "text-green-400 bg-green-400/10 border-green-400/20",
  completed: "text-white/60 bg-white/5 border-white/10",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  archived: "text-white/30 bg-white/3 border-white/8",
};

async function getBookings(): Promise<Booking[] | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API}/api/v1/admin/bookings`, {
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

export default async function BookingsPage() {
  const bookings = await getBookings();

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
          <h1 className={`text-3xl ${bold.className}`}>Bookings</h1>
        </div>
      </div>

      {!bookings ? (
        <EmptyState message="Backend not connected — bookings will appear here once deployed." />
      ) : bookings.length === 0 ? (
        <EmptyState message="No bookings yet. Share your booking link to get started." />
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className="border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/25 hover:bg-white/3 transition-all"
            >
              <div className="flex flex-col gap-1">
                <p className={`text-sm ${semibold.className}`}>{b.shoot_type}</p>
                <p className="text-xs text-white/40">{formatDate(b.start_time)} · {b.location}</p>
              </div>
              <div className="flex items-center gap-4">
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
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
      {message}
    </div>
  );
}
