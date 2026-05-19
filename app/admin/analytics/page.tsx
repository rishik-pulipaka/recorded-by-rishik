import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

export const metadata: Metadata = { title: "Analytics" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type FunnelStep = { step: string; label: string; count: number; pct: number };
type Overview = {
  revenue_this_month: number;
  revenue_last_month: number;
  bookings_this_month: number;
  bookings_last_month: number;
  conversion_rate: number;
  avg_booking_value: number;
  top_shoot_type: string | null;
  total_clients: number;
};

async function getAnalytics(): Promise<{ funnel: FunnelStep[]; overview: Overview } | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const [funnelRes, overviewRes] = await Promise.all([
      fetch(`${API}/api/v1/admin/analytics/funnel`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API}/api/v1/admin/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);
    if (!funnelRes.ok || !overviewRes.ok) return null;
    const [funnel, overview] = await Promise.all([funnelRes.json(), overviewRes.json()]);
    return { funnel, overview };
  } catch {
    return null;
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  if (!data) {
    return (
      <div className={`text-secondary ${mono.className}`}>
        <div className="mb-8">
          <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
          <h1 className={`text-3xl ${bold.className}`}>Analytics</h1>
        </div>
        <div className="border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
          Backend not connected — analytics will appear here once deployed.
        </div>
      </div>
    );
  }

  const { funnel, overview } = data;

  const revDelta =
    overview.revenue_last_month > 0
      ? Math.round(
          ((overview.revenue_this_month - overview.revenue_last_month) /
            overview.revenue_last_month) *
            100
        )
      : null;

  const bookingsDelta =
    overview.bookings_last_month > 0
      ? Math.round(
          ((overview.bookings_this_month - overview.bookings_last_month) /
            overview.bookings_last_month) *
            100
        )
      : null;

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-8">
        <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
        <h1 className={`text-3xl ${bold.className}`}>Analytics</h1>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 mb-2">REVENUE THIS MONTH</p>
          <p className={`text-2xl ${semibold.className} text-white`}>
            ${overview.revenue_this_month.toLocaleString()}
          </p>
          {revDelta !== null && (
            <p className={`text-xs mt-1 ${revDelta >= 0 ? "text-green-400" : "text-red-400"}`}>
              {revDelta >= 0 ? `+${revDelta}%` : `${revDelta}%`} vs last month
            </p>
          )}
        </div>
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 mb-2">BOOKINGS THIS MONTH</p>
          <p className={`text-2xl ${semibold.className} text-white`}>
            {overview.bookings_this_month}
          </p>
          {bookingsDelta !== null && (
            <p
              className={`text-xs mt-1 ${bookingsDelta >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {bookingsDelta >= 0 ? `+${bookingsDelta}%` : `${bookingsDelta}%`} vs last month
            </p>
          )}
        </div>
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 mb-2">CONVERSION RATE</p>
          <p className={`text-2xl ${semibold.className} text-white`}>
            {overview.conversion_rate.toFixed(1)}%
          </p>
          <p className="text-xs text-white/30 mt-1">quotes → bookings</p>
        </div>
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 mb-2">AVG BOOKING VALUE</p>
          <p className={`text-2xl ${semibold.className} text-white`}>
            ${overview.avg_booking_value.toLocaleString()}
          </p>
          {overview.top_shoot_type && (
            <p className="text-xs text-white/30 mt-1">Top: {overview.top_shoot_type}</p>
          )}
        </div>
      </div>

      {/* Booking funnel */}
      <div className="mb-10">
        <p className="text-xs tracking-[4px] text-white/40 mb-4">BOOKING FUNNEL</p>
        <div className="border border-white/10 rounded-xl overflow-hidden">
          {funnel.map((step, i) => (
            <div
              key={step.step}
              className={`flex items-center gap-4 px-5 py-4 ${i < funnel.length - 1 ? "border-b border-white/5" : ""}`}
            >
              <div className="w-6 text-xs text-white/30 shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className={`text-sm ${semibold.className}`}>{step.label}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-white/40">{step.count.toLocaleString()}</p>
                    <p className="text-xs text-white/60 w-10 text-right">{step.pct.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/30 rounded-full transition-all"
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {funnel.length === 0 && (
          <div className="border border-white/10 rounded-xl p-8 text-center text-white/30 text-sm">
            No funnel data yet. Funnel populates once visitors interact with the booking form.
          </div>
        )}
      </div>

      {/* Total clients */}
      <div className="border border-white/10 rounded-xl p-5 flex items-center justify-between">
        <p className="text-sm text-white/60">Total clients on platform</p>
        <p className={`text-xl ${semibold.className}`}>{overview.total_clients}</p>
      </div>
    </div>
  );
}
