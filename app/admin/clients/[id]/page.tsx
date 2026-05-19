import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Link from "next/link";

export const metadata: Metadata = { title: "Client" };

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

type ClientDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  total_bookings: number;
  lifetime_value: number;
  avg_booking_value: number;
  last_shoot_date: string | null;
  days_since_last_shoot: number | null;
  bookings: {
    id: string;
    shoot_type: string;
    start_time: string;
    status: string;
    quote_total: number;
  }[];
};

async function getClient(id: string): Promise<ClientDetail | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API}/api/v1/admin/clients/${id}`, {
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
  });
}

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await getClient(id);

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-6">
        <Link href="/admin/clients" className="text-xs text-white/30 hover:text-white/60 transition-colors">
          ← Back to clients
        </Link>
      </div>

      {!client ? (
        <div className="border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
          Client not found or backend not connected.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs tracking-[4px] text-white/40 mb-1">CLIENT</p>
            <h1 className={`text-2xl ${bold.className}`}>{client.name}</h1>
            <p className="text-sm text-white/50 mt-1">
              {client.email}{client.phone ? ` · ${client.phone}` : ""}
            </p>
          </div>

          {/* CRM stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">LIFETIME VALUE</p>
              <p className={`text-xl ${semibold.className}`}>${client.lifetime_value.toLocaleString()}</p>
            </div>
            <div className="border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">TOTAL BOOKINGS</p>
              <p className={`text-xl ${semibold.className}`}>{client.total_bookings}</p>
            </div>
            <div className="border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">AVG VALUE</p>
              <p className={`text-xl ${semibold.className}`}>${client.avg_booking_value.toLocaleString()}</p>
            </div>
            <div className="border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">DAYS SINCE SHOOT</p>
              <p className={`text-xl ${semibold.className}`}>
                {client.days_since_last_shoot ?? "—"}
              </p>
              {client.last_shoot_date && (
                <p className="text-xs text-white/30 mt-0.5">{formatDate(client.last_shoot_date)}</p>
              )}
            </div>
          </div>

          <div className="border border-white/10 rounded-xl p-4">
            <p className="text-xs text-white/40 mb-1">CLIENT SINCE</p>
            <p className="text-sm">{formatDate(client.created_at)}</p>
          </div>

          {/* Booking history */}
          <div>
            <p className="text-xs tracking-[4px] text-white/40 mb-3">BOOKING HISTORY</p>
            {client.bookings.length === 0 ? (
              <div className="border border-white/10 rounded-xl p-8 text-center text-white/30 text-sm">
                No bookings yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {client.bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className="border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/25 hover:bg-white/3 transition-all"
                  >
                    <div>
                      <p className={`text-sm ${semibold.className}`}>{b.shoot_type}</p>
                      <p className="text-xs text-white/40 mt-0.5">{formatDate(b.start_time)}</p>
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
          </div>
        </div>
      )}
    </div>
  );
}
