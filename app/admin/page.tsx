import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

export const metadata: Metadata = { title: "Admin — Overview" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

async function getOverview() {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const res = await fetch(`${API}/api/v1/admin/analytics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<{
      upcoming_shoots_7d: number;
      pending_confirmations: number;
      revenue_this_month: number;
      total_clients: number;
    }>;
  } catch {
    return null;
  }
}

export default async function AdminOverview() {
  const overview = await getOverview();

  const stats = [
    { label: "Upcoming (7 days)", value: overview?.upcoming_shoots_7d ?? "—" },
    { label: "Pending confirmations", value: overview?.pending_confirmations ?? "—", alert: (overview?.pending_confirmations ?? 0) > 0 },
    { label: "Revenue this month", value: overview ? `$${overview.revenue_this_month.toFixed(0)}` : "—" },
    { label: "Total clients", value: overview?.total_clients ?? "—" },
  ];

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-8">
        <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
        <h1 className={`text-3xl ${bold.className}`}>Overview</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, alert }) => (
          <div
            key={label}
            className={`border rounded-xl p-6 ${
              alert ? "border-amber-400/40 bg-amber-400/5" : "border-white/10"
            }`}
          >
            <p className="text-xs text-white/40 tracking-[2px] mb-2">{label.toUpperCase()}</p>
            <p className={`text-3xl ${bold.className} ${alert ? "text-amber-400" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/admin/bookings", label: "Manage Bookings", icon: "📅" },
          { href: "/admin/clients", label: "View Clients", icon: "👥" },
          { href: "/admin/quotes", label: "Unconverted Quotes", icon: "💬" },
          { href: "/admin/pricing", label: "Edit Pricing", icon: "💰" },
          { href: "/admin/analytics", label: "Funnel Analytics", icon: "📊" },
          { href: "/admin/settings", label: "Settings", icon: "⚙️" },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="border border-white/10 rounded-xl p-5 flex items-center gap-4 hover:border-white/25 hover:bg-white/3 transition-all"
          >
            <span className="text-2xl">{icon}</span>
            <span className={`text-sm ${semibold.className}`}>{label}</span>
            <span className="ml-auto text-white/20">›</span>
          </Link>
        ))}
      </div>

      {!API && (
        <p className="mt-8 text-xs text-white/30 border border-white/10 rounded-lg p-3">
          Backend not connected. Set <code className="font-mono text-white/50">NEXT_PUBLIC_API_URL</code> to see live data.
        </p>
      )}
    </div>
  );
}
