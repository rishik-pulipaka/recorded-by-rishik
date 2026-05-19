import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";
import BookingDetailClient from "./BookingDetailClient";

export const metadata: Metadata = { title: "Booking" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type BookingDetail = {
  id: string;
  shoot_type: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  quote_total: number;
  deposit_amount: number;
  balance_paid: boolean;
  special_notes: string | null;
  client: { id: string; name: string; email: string; phone: string | null };
  addons: { name: string; price: number }[];
  messages: { id: string; sender_name: string; body: string; created_at: string; is_admin: boolean }[];
  events: { event_type: string; created_at: string; payload: Record<string, unknown> }[];
  deliverable: { gallery_url: string; notes: string | null; delivered_at: string } | null;
};

async function getBooking(id: string): Promise<BookingDetail | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API}/api/v1/admin/bookings/${id}`, {
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
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-6">
        <Link href="/admin/bookings" className="text-xs text-white/30 hover:text-white/60 transition-colors">
          ← Back to bookings
        </Link>
      </div>

      {!booking ? (
        <div className="border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
          Booking not found or backend not connected.
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-xs tracking-[4px] text-white/40 mb-1">BOOKING</p>
            <h1 className={`text-2xl ${bold.className}`}>{booking.shoot_type}</h1>
            <p className="text-sm text-white/50 mt-1">{formatDate(booking.start_time)}</p>
          </div>
          <BookingDetailClient booking={booking} />
        </>
      )}
    </div>
  );
}
