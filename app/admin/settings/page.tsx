import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = { title: "Settings" };

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type SettingsData = {
  google_calendar_connected: boolean;
  calendar_id: string | null;
  business_hours: { day: number; open: string; close: string; enabled: boolean }[];
  notification_email: string | null;
};

async function getSettings(): Promise<SettingsData | null> {
  try {
    const { getToken } = await auth();
    const token = await getToken();
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    const res = await fetch(`${API}/api/v1/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className={`text-secondary ${mono.className}`}>
      <div className="mb-8">
        <p className="text-xs tracking-[4px] text-white/40 mb-1">ADMIN</p>
        <h1 className={`text-3xl ${bold.className}`}>Settings</h1>
      </div>
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
