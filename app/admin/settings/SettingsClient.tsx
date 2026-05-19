"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type BusinessHour = { day: number; open: string; close: string; enabled: boolean };

type SettingsData = {
  google_calendar_connected: boolean;
  calendar_id: string | null;
  business_hours: BusinessHour[];
  notification_email: string | null;
};

const DEFAULT_HOURS: BusinessHour[] = DAYS.map((_, i) => ({
  day: i,
  open: "09:00",
  close: "19:00",
  enabled: i >= 1 && i <= 6,
}));

export default function SettingsClient({ initialSettings }: { initialSettings: SettingsData | null }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState<BusinessHour[]>(
    initialSettings?.business_hours ?? DEFAULT_HOURS
  );
  const [notifEmail, setNotifEmail] = useState(initialSettings?.notification_email ?? "");
  const calendarConnected = initialSettings?.google_calendar_connected ?? false;

  const updateHour = (day: number, field: keyof BusinessHour, value: string | boolean) => {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: value } : h))
    );
  };

  const saveSettings = async () => {
    setSaving(true);
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    try {
      await fetch(`${API}/api/v1/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_hours: hours, notification_email: notifEmail }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const connectCalendar = async () => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    try {
      const res = await fetch(`${API}/api/v1/admin/settings/google-calendar/connect`, {
        method: "POST",
      });
      const { auth_url } = await res.json();
      window.location.href = auth_url;
    } catch {
      alert("Could not initiate Google Calendar connection. Is the backend running?");
    }
  };

  if (!initialSettings) {
    return (
      <div className={`border border-white/10 rounded-xl p-10 text-center text-white/30 text-sm ${mono.className}`}>
        Backend not connected — settings will appear here once deployed.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-8 ${mono.className}`}>
      {/* Google Calendar */}
      <section className="border border-white/10 rounded-xl p-6">
        <p className="text-xs tracking-[4px] text-white/40 mb-4">GOOGLE CALENDAR</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-sm ${semibold.className}`}>Calendar sync</p>
            <p className="text-xs text-white/40 mt-0.5">
              {calendarConnected
                ? `Connected${initialSettings.calendar_id ? ` · ${initialSettings.calendar_id}` : ""}`
                : "Not connected — new bookings won't block your calendar"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-full border ${
                calendarConnected
                  ? "text-green-400 bg-green-400/10 border-green-400/20"
                  : "text-white/30 bg-white/5 border-white/10"
              }`}
            >
              {calendarConnected ? "Connected" : "Disconnected"}
            </span>
            {!calendarConnected && (
              <button
                onClick={connectCalendar}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                Connect
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Business hours */}
      <section className="border border-white/10 rounded-xl p-6">
        <p className="text-xs tracking-[4px] text-white/40 mb-4">BUSINESS HOURS</p>
        <div className="flex flex-col gap-2">
          {hours.map((h) => (
            <div key={h.day} className="flex items-center gap-4">
              <div className="w-28 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={(e) => updateHour(h.day, "enabled", e.target.checked)}
                  className="accent-white"
                />
                <span className={`text-sm ${h.enabled ? "text-white" : "text-white/30"}`}>
                  {DAYS[h.day].slice(0, 3)}
                </span>
              </div>
              {h.enabled ? (
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="time"
                    value={h.open}
                    onChange={(e) => updateHour(h.day, "open", e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                  <span className="text-white/30">–</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={(e) => updateHour(h.day, "close", e.target.value)}
                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
                  />
                </div>
              ) : (
                <span className="text-xs text-white/20">Closed</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Notification email */}
      <section className="border border-white/10 rounded-xl p-6">
        <p className="text-xs tracking-[4px] text-white/40 mb-4">NOTIFICATIONS</p>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-white/60">Notification email</label>
          <input
            type="email"
            value={notifEmail}
            onChange={(e) => setNotifEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full max-w-sm px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
          />
          <p className="text-xs text-white/30">New bookings and messages are sent to this address.</p>
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && <span className="text-xs text-green-400">Saved.</span>}
      </div>
    </div>
  );
}
