import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

export const metadata: Metadata = { title: "Clients" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type Client = { id: string; name: string; email: string; phone: string | null; created_at: string };

async function getClients(): Promise<Client[] | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API}/api/v1/admin/clients`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-8">
        <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
        <h1 className={`text-3xl ${bold.className}`}>Clients</h1>
      </div>

      {!clients || clients.length === 0 ? (
        <div className="border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
          {!clients ? "Backend not connected — clients will appear here once deployed." : "No clients yet."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-white/25 hover:bg-white/3 transition-all"
            >
              <div>
                <p className={`text-sm ${semibold.className}`}>{c.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-white/30">
                  Since {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
                <span className="text-white/20">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
