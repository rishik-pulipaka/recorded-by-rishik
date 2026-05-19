import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import PricingEditor from "./PricingEditor";

export const metadata: Metadata = { title: "Pricing" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

async function getPricing() {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API}/api/v1/pricing`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PricingPage() {
  const rules = await getPricing();

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-8">
        <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
        <h1 className={`text-3xl ${bold.className}`}>Pricing Rules</h1>
        <p className="text-sm text-white/50 mt-2">
          Changes take effect immediately on the booking form.
        </p>
      </div>
      <PricingEditor initialRules={rules} />
    </div>
  );
}
