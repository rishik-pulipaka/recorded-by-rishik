"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });

const STATUS_OPTIONS = [
  "pending_confirmation",
  "confirmed",
  "deposit_paid",
  "completed",
  "cancelled",
  "archived",
];

const STATUS_COLOR: Record<string, string> = {
  pending_confirmation: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  deposit_paid: "text-green-400 bg-green-400/10 border-green-400/20",
  completed: "text-white/60 bg-white/5 border-white/10",
  cancelled: "text-red-400 bg-red-400/10 border-red-400/20",
  archived: "text-white/30 bg-white/3 border-white/8",
};

type BookingDetail = {
  id: string;
  shoot_type: string;
  start_time: string;
  end_time: string;
  location: string;
  status: string;
  quote_total: number;
  deposit_amount: number;
  balance_paid: boolean;
  special_notes: string | null;
  client: { id: string; name: string; email: string; phone: string | null };
  addons: { name: string; price: number }[];
  messages: { id: string; sender_name: string; body: string; created_at: string; is_admin: boolean }[];
  events: { event_type: string; created_at: string; payload: Record<string, unknown> }[];
  deliverable: { gallery_url: string; notes: string | null; delivered_at: string } | null;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default function BookingDetailClient({ booking: initial }: { booking: BookingDetail }) {
  const [booking, setBooking] = useState(initial);
  const [statusLoading, setStatusLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [galleryUrl, setGalleryUrl] = useState(initial.deliverable?.gallery_url ?? "");
  const [galleryNotes, setGalleryNotes] = useState(initial.deliverable?.notes ?? "");
  const [savingDeliverable, setSavingDeliverable] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "";

  const updateStatus = async (newStatus: string) => {
    setStatusLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setBooking((prev) => ({ ...prev, status: newStatus }));
      }
    } catch {}
    setStatusLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/bookings/${booking.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setBooking((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
        setNewMessage("");
      }
    } catch {}
    setSendingMsg(false);
  };

  const saveDeliverable = async () => {
    setSavingDeliverable(true);
    try {
      const res = await fetch(`${API}/api/v1/admin/bookings/${booking.id}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gallery_url: galleryUrl, notes: galleryNotes }),
      });
      if (res.ok) {
        const del = await res.json();
        setBooking((prev) => ({ ...prev, deliverable: del }));
      }
    } catch {}
    setSavingDeliverable(false);
  };

  return (
    <div className={`flex flex-col gap-6 ${mono.className}`}>
      {/* Top row: client info + status */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Client */}
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 mb-3">CLIENT</p>
          <p className={`text-sm ${semibold.className}`}>{booking.client.name}</p>
          <p className="text-xs text-white/50 mt-0.5">{booking.client.email}</p>
          {booking.client.phone && (
            <p className="text-xs text-white/50">{booking.client.phone}</p>
          )}
        </div>

        {/* Financials + Status */}
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs text-white/40 mb-3">FINANCIALS</p>
          <div className="flex flex-col gap-1.5 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Total</span>
              <span className={semibold.className}>${booking.quote_total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Deposit</span>
              <span>${booking.deposit_amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Balance paid</span>
              <span className={booking.balance_paid ? "text-green-400" : "text-white/30"}>
                {booking.balance_paid ? "Yes" : "No"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLOR[booking.status] ?? "text-white/40 bg-white/5 border-white/10"}`}>
              {booking.status.replace(/_/g, " ")}
            </span>
            <select
              value={booking.status}
              disabled={statusLoading}
              onChange={(e) => updateStatus(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Shoot details */}
      <div className="border border-white/10 rounded-xl p-5">
        <p className="text-xs text-white/40 mb-3">SHOOT DETAILS</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-0.5">Location</p>
            <p>{booking.location}</p>
          </div>
          {booking.addons.length > 0 && (
            <div>
              <p className="text-white/40 text-xs mb-0.5">Add-ons</p>
              <p>{booking.addons.map((a) => a.name).join(", ")}</p>
            </div>
          )}
          {booking.special_notes && (
            <div className="sm:col-span-2">
              <p className="text-white/40 text-xs mb-0.5">Special notes</p>
              <p className="text-white/70">{booking.special_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Deliverables */}
      <div className="border border-white/10 rounded-xl p-5">
        <p className="text-xs text-white/40 mb-3">DELIVERABLES</p>
        {booking.deliverable ? (
          <div className="text-sm">
            <p className="text-white/50 text-xs mb-1">Gallery URL</p>
            <a href={booking.deliverable.gallery_url} target="_blank" rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all text-xs"
            >
              {booking.deliverable.gallery_url}
            </a>
            {booking.deliverable.notes && (
              <p className="text-white/50 text-xs mt-2">{booking.deliverable.notes}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="url"
              value={galleryUrl}
              onChange={(e) => setGalleryUrl(e.target.value)}
              placeholder="https://gallery.example.com/..."
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
            <input
              type="text"
              value={galleryNotes}
              onChange={(e) => setGalleryNotes(e.target.value)}
              placeholder="Optional note to client…"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
            />
            <button
              onClick={saveDeliverable}
              disabled={savingDeliverable || !galleryUrl}
              className="self-start px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm disabled:opacity-40 transition-colors"
            >
              {savingDeliverable ? "Sending…" : "Send gallery to client"}
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="border border-white/10 rounded-xl p-5">
        <p className="text-xs text-white/40 mb-3">MESSAGES</p>
        <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto">
          {booking.messages.length === 0 && (
            <p className="text-xs text-white/30 text-center py-4">No messages yet.</p>
          )}
          {booking.messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.is_admin ? "flex-row-reverse" : ""}`}>
              <div className={`flex flex-col max-w-[80%] ${m.is_admin ? "items-end" : ""}`}>
                <p className={`text-xs text-white/30 mb-1 ${m.is_admin ? "text-right" : ""}`}>
                  {m.sender_name} · {timeAgo(m.created_at)}
                </p>
                <div className={`px-3 py-2 rounded-xl text-sm ${
                  m.is_admin ? "bg-white/10 text-white" : "bg-white/5 text-white/80"
                }`}>
                  {m.body}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Message client…"
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
          />
          <button
            onClick={sendMessage}
            disabled={sendingMsg || !newMessage.trim()}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>
      </div>

      {/* Event timeline */}
      {booking.events.length > 0 && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs tracking-[4px] text-white/40 mb-3">TIMELINE</p>
          <div className="flex flex-col gap-2">
            {booking.events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="text-white/20">{timeAgo(e.created_at)}</span>
                <span className="text-white/50">{e.event_type.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
