"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Montserrat } from "next/font/google";

export const metadata = undefined; // page title handled by layout

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

type Profile = { name: string; email: string; phone: string | null };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { getToken } = useAuth();
  const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/api/v1/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
        }
      } catch {}
    }
    load();
  }, [API, getToken]);

  const save = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await fetch(`${API}/api/v1/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, phone: phone || null }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className={`text-secondary max-w-md flex flex-col gap-6 ${mono.className}`}>
      <div>
        <p className="text-xs tracking-[4px] text-white/40 mb-1">ACCOUNT</p>
        <h1 className={`text-3xl ${bold.className}`}>Profile</h1>
      </div>

      <div className="border border-white/10 rounded-xl p-6 flex flex-col gap-4">
        <div>
          <label className={`block text-xs text-white/40 mb-1.5 ${semibold.className}`}>
            FULL NAME
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>

        <div>
          <label className={`block text-xs text-white/40 mb-1.5 ${semibold.className}`}>
            EMAIL
          </label>
          <p className="text-sm text-white/40 px-3 py-2">
            {profile?.email ?? "—"}
          </p>
          <p className="text-xs text-white/20 mt-0.5">
            Email is managed by your sign-in provider.
          </p>
        </div>

        <div>
          <label className={`block text-xs text-white/40 mb-1.5 ${semibold.className}`}>
            PHONE <span className="font-normal">(optional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
          />
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-white text-black text-sm hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-xs text-green-400">Saved.</span>}
        </div>
      </div>
    </div>
  );
}
