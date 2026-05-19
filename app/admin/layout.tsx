import Link from "next/link";
import { Montserrat } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { template: "%s — Admin", default: "Admin" } };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });

const NAV = [
  { href: "/admin", label: "Overview", icon: "⬡" },
  { href: "/admin/bookings", label: "Bookings", icon: "📅" },
  { href: "/admin/clients", label: "Clients", icon: "👥" },
  { href: "/admin/quotes", label: "Quotes", icon: "💬" },
  { href: "/admin/pricing", label: "Pricing", icon: "💰" },
  { href: "/admin/analytics", label: "Analytics", icon: "📊" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`flex min-h-[calc(100svh-151px)] ${mono.className}`}>
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/10 bg-stone-950/40 pt-8 pb-6 px-4 gap-1">
        <p className="text-xs tracking-[4px] text-white/30 px-2 mb-4">ADMIN</p>
        {NAV.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-all"
          >
            <span>{icon}</span>
            <span className={semibold.className}>{label}</span>
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-xs text-white/30 hover:text-white/60">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden w-full fixed top-[120px] z-10 bg-primary/95 backdrop-blur border-b border-white/10 overflow-x-auto">
        <div className="flex gap-1 px-4 py-2">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-6 py-8 md:py-10 overflow-y-auto mt-10 md:mt-0">
        {children}
      </main>
    </div>
  );
}
