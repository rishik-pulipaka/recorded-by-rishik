"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
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

const STATUS_DESCRIPTION: Record<string, string> = {
  pending_confirmation: "Your booking is awaiting confirmation from Rishik.",
  confirmed: "Your shoot is confirmed! See details below.",
  deposit_paid: "Deposit received — you're all set.",
  completed: "Shoot completed.",
  cancelled: "This booking has been cancelled.",
  archived: "This booking is archived.",
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
  const { getToken } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [rescheduleNote, setRescheduleNote] = useState("");
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleSent, setRescheduleSent] = useState(false);

  const API = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const res = await fetch(`${API}/api/v1/bookings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (res.ok) setBooking(await res.json());
      } catch {}
      setLoading(false);
    }
    load();
  }, [id, API, getToken]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !booking) return;
    setSendingMsg(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/v1/bookings/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      const token = await getToken();
      await fetch(`${API}/api/v1/bookings/${id}/reschedule-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rescheduleNote, proposed_start: booking?.start_time, proposed_end: booking?.end_time }),
      });
      setRescheduleSent(true);
      setRescheduleOpen(false);
    } catch {}
  };

  if (loading) {
    return (
      <div className={`text-secondary ${mono.className}`}>
        <div className="animate-pulse flex flex-col gap-4 max-w-2xl">
          <div className="h-3 bg-white/5 rounded w-24" />
          <div className="h-8 bg-white/5 rounded w-56" />
          <div className="h-32 bg-white/5 rounded" />
          <div className="h-48 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={`text-secondary ${mono.className}`}>
        <Link href="/dashboard" className="text-xs text-white/30 hover:text-white/60">← My bookings</Link>
        <div className="mt-8 border border-white/10 rounded-xl p-12 text-center text-white/30 text-sm">
          Booking not found.
        </div>
      </div>
    );
  }

  const isActive = !["completed", "cancelled", "archived"].includes(booking.status);

  return (
    <div className={`text-secondary max-w-2xl flex flex-col gap-6 ${mono.className}`}>
      <Link href="/dashboard" className="text-xs text-white/30 hover:text-white/60 transition-colors">
        ← My bookings
      </Link>

      <div>
        <p className="text-xs tracking-[4px] text-white/40 mb-1">BOOKING</p>
        <h1 className={`text-2xl ${bold.className}`}>{booking.shoot_type}</h1>
        <p className="text-sm text-white/50 mt-1">{formatDate(booking.start_time)}</p>
      </div>

      {/* Status banner */}
      <div className={`rounded-xl px-5 py-4 border flex items-start gap-3 ${STATUS_COLOR[booking.status] ?? "border-white/10 bg-white/5"}`}>
        <div className="flex-1">
          <span className={`text-xs font-semibold uppercase tracking-widest`}>
            {booking.status.replace(/_/g, " ")}
          </span>
          <p className="text-xs text-white/60 mt-0.5">
            {STATUS_DESCRIPTION[booking.status] ?? ""}
          </p>
        </div>
        <p className={`text-sm shrink-0 ${semibold.className}`}>${booking.quote_total}</p>
      </div>

      {/* Shoot details */}
      <div className="border border-white/10 rounded-xl p-5">
        <p className="text-xs tracking-[4px] text-white/40 mb-3">DETAILS</p>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-white/40 text-xs mb-0.5">Location</p>
            <p>{booking.location}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-0.5">End time</p>
            <p>{new Date(booking.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</p>
          </div>
          {booking.addons.length > 0 && (
            <div className="sm:col-span-2">
              <p className="text-white/40 text-xs mb-0.5">Add-ons</p>
              <p>{booking.addons.map((a) => `${a.name} (+$${a.price})`).join(", ")}</p>
            </div>
          )}
          {booking.special_notes && (
            <div className="sm:col-span-2">
              <p className="text-white/40 text-xs mb-0.5">Your notes</p>
              <p className="text-white/70">{booking.special_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Gallery (deliverable) */}
      {booking.deliverable && (
        <div className="border border-green-400/25 bg-green-400/5 rounded-xl p-5">
          <p className="text-xs tracking-[4px] text-green-400/70 mb-3">YOUR GALLERY IS READY</p>
          <a
            href={booking.deliverable.gallery_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-400/10 border border-green-400/20 text-green-400 text-sm hover:bg-green-400/20 transition-colors"
          >
            View your photos →
          </a>
          {booking.deliverable.notes && (
            <p className="text-xs text-white/50 mt-3">{booking.deliverable.notes}</p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="border border-white/10 rounded-xl p-5">
        <p className="text-xs tracking-[4px] text-white/40 mb-3">MESSAGES</p>
        <div className="flex flex-col gap-3 mb-4 max-h-72 overflow-y-auto">
          {booking.messages.length === 0 && (
            <p className="text-xs text-white/30 text-center py-4">No messages yet. Ask Rishik anything below.</p>
          )}
          {booking.messages.map((m) => (
            <div key={m.id} className={`flex ${!m.is_admin ? "flex-row-reverse" : ""}`}>
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

      {/* Reschedule */}
      {isActive && (
        <div className="border border-white/10 rounded-xl p-5">
          <p className="text-xs tracking-[4px] text-white/40 mb-3">NEED TO RESCHEDULE?</p>
          {rescheduleSent ? (
            <p className="text-sm text-green-400">Request sent. Rishik will follow up shortly.</p>
          ) : rescheduleOpen ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={rescheduleNote}
                onChange={(e) => setRescheduleNote(e.target.value)}
                placeholder="What dates work for you? Any notes for Rishik…"
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
    </div>
  );
}
