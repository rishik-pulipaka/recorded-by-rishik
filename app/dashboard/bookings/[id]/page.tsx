"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Montserrat } from "next/font/google";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

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
  special_notes: string | null;
  addons: { name: string; price: number }[];
  messages: { id: string; sender_name: string; body: string; created_at: string; is_admin: boolean }[];
  deliverable: { gallery_url: string; notes: string | null } | null;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ClientBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleSent, setRescheduleSent] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL ?? "";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/v1/bookings/${id}`, { cache: "no-store" });
        if (res.ok) setBooking(await res.json());
      } catch {}
      setLoading(false);
    }
    load();
  }, [id, API]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !booking) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API}/api/v1/bookings/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setBooking((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
        setNewMessage("");
      }
    } catch {}
    setSendingMsg(false);
  };

  const sendReschedule = async () => {
    try {
      await fetch(`${API}/api/v1/bookings/${id}/reschedule-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: rescheduleNote }),
      });
      setRescheduleSent(true);
      setRescheduleOpen(false);
    } catch {}
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-primary text-secondary px-6 py-10 ${mono.className}`}>
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-white/5 rounded w-32" />
            <div className="h-8 bg-white/5 rounded w-64" />
            <div className="h-32 bg-white/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={`min-h-screen bg-primary text-secondary px-6 py-10 ${mono.className}`}>
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard" className="text-xs text-white/30 hover:text-white/60">← Back</Link>
          <div className="mt-8 border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
            Booking not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-primary text-secondary px-6 py-10 ${mono.className}`}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <Link href="/dashboard" className="text-xs text-white/30 hover:text-white/60 transition-colors">
          ← My bookings
        </Link>

        <div>
          <p className="text-xs tracking-[4px] text-white/40 mb-1">BOOKING</p>
          <h1 className={`text-2xl ${bold.className}`}>{booking.shoot_type}</h1>
          <p className="text-sm text-white/50 mt-1">{formatDate(booking.start_time)}</p>
        </div>

        {/* Status + summary */}
        <div className="border border-white/10 rounded-xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLOR[booking.status] ?? "text-white/40 bg-white/5 border-white/10"}`}>
              {booking.status.replace(/_/g, " ")}
            </span>
            <p className={`text-sm ${semibold.className}`}>${booking.quote_total}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
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
                <p className="text-white/40 text-xs mb-0.5">Notes</p>
                <p className="text-white/70">{booking.special_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Deliverables (gallery link) */}
        {booking.deliverable && (
          <div className="border border-green-400/20 bg-green-400/5 rounded-xl p-5">
            <p className="text-xs tracking-[4px] text-green-400/60 mb-2">YOUR GALLERY IS READY</p>
            <a
              href={booking.deliverable.gallery_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-400 hover:underline break-all"
            >
              {booking.deliverable.gallery_url}
            </a>
            {booking.deliverable.notes && (
              <p className="text-xs text-white/50 mt-2">{booking.deliverable.notes}</p>
            )}
          </div>
        )}

        {/* Reschedule */}
        {!["completed", "cancelled", "archived"].includes(booking.status) && (
          <div className="border border-white/10 rounded-xl p-5">
            <p className="text-xs tracking-[4px] text-white/40 mb-3">NEED TO RESCHEDULE?</p>
            {rescheduleSent ? (
              <p className="text-sm text-green-400">Reschedule request sent. Rishik will follow up shortly.</p>
            ) : rescheduleOpen ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  placeholder="What dates work for you? Any notes for Rishik..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={sendReschedule}
                    className="px-4 py-2 rounded-lg bg-white text-black text-sm hover:bg-white/90 transition-colors"
                  >
                    Send request
                  </button>
                  <button
                    onClick={() => setRescheduleOpen(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setRescheduleOpen(true)}
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Request a reschedule →
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs tracking-[4px] text-white/40 mb-3">MESSAGES</p>
          <div className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto">
            {booking.messages.length === 0 && (
              <p className="text-xs text-white/30 text-center py-4">No messages yet. Send one below.</p>
            )}
            {booking.messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${!m.is_admin ? "flex-row-reverse" : ""}`}>
                <div className={`flex flex-col max-w-[80%] ${!m.is_admin ? "items-end" : ""}`}>
                  <p className={`text-xs text-white/30 mb-1 ${!m.is_admin ? "text-right" : ""}`}>
                    {m.sender_name} · {timeAgo(m.created_at)}
                  </p>
                  <div className={`px-3 py-2 rounded-xl text-sm ${
                    !m.is_admin ? "bg-white/10 text-white" : "bg-white/5 text-white/80"
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
              placeholder="Message Rishik…"
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
      </div>
    </div>
  );
}
