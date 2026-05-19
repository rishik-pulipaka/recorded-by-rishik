import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

export const metadata: Metadata = { title: "Quotes" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type Quote = {
  id: string;
  session_id: string;
  shoot_type: string;
  package_name: string;
  total: number;
  created_at: string;
  converted_to_booking_id: string | null;
  user_name: string | null;
  user_email: string | null;
};

async function getQuotes(): Promise<Quote[] | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API}/api/v1/admin/quotes`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default async function QuotesPage() {
  const quotes = await getQuotes();

  const unconverted = quotes?.filter((q) => !q.converted_to_booking_id) ?? [];
  const converted = quotes?.filter((q) => q.converted_to_booking_id) ?? [];

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-8">
        <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
        <h1 className={`text-3xl ${bold.className}`}>Quotes</h1>
        <p className="text-sm text-white/50 mt-2">
          Unconverted quotes are potential leads — follow up within 24 hours.
        </p>
      </div>

      {!quotes ? (
        <div className="border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
          Backend not connected — quotes will appear here once deployed.
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Unconverted */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <p className="text-xs tracking-[4px] text-white/40">UNCONVERTED</p>
              {unconverted.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400">
                  {unconverted.length} lead{unconverted.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unconverted.length === 0 ? (
              <div className="border border-white/10 rounded-xl p-8 text-center text-white/30 text-sm">
                No unconverted quotes.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {unconverted.map((q) => (
                  <div
                    key={q.id}
                    className="border border-amber-400/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-400/3"
                  >
                    <div>
                      <p className={`text-sm ${semibold.className}`}>
                        {q.user_name ?? "Anonymous"}{" "}
                        {q.user_email && (
                          <span className="text-white/40 font-normal">· {q.user_email}</span>
                        )}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {q.shoot_type} · {q.package_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <p className={`text-sm ${semibold.className}`}>${q.total}</p>
                      <p className="text-xs text-white/30">{timeAgo(q.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Converted */}
          <section>
            <p className="text-xs tracking-[4px] text-white/40 mb-4">CONVERTED TO BOOKINGS</p>
            {converted.length === 0 ? (
              <div className="border border-white/10 rounded-xl p-8 text-center text-white/30 text-sm">
                No converted quotes yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {converted.map((q) => (
                  <div
                    key={q.id}
                    className="border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-60"
                  >
                    <div>
                      <p className={`text-sm ${semibold.className}`}>
                        {q.user_name ?? "Anonymous"}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {q.shoot_type} · {q.package_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <p className={`text-sm ${semibold.className}`}>${q.total}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">
                        booked
                      </span>
                      <p className="text-xs text-white/30">{timeAgo(q.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
