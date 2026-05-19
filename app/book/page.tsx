"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";
import { SHOOT_TYPES, PACKAGES, ADDONS, computeQuote } from "@/lib/pricing";
import { submitBooking } from "@/lib/api";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

// ── Session storage key ────────────────────────────────────────────────────
const STORAGE_KEY = "rbr-booking-state";

// ── Form state shape ───────────────────────────────────────────────────────
interface BookingDraft {
  step: number;
  shootType: string;
  packageId: string;
  addonIds: string[];
  date: string;
  timeSlot: string;
  locationType: "studio" | "client_choice" | "custom";
  locationAddress: string;
  name: string;
  email: string;
  phone: string;
  specialNotes: string;
  sessionId: string;
}

const defaultDraft = (): BookingDraft => ({
  step: 1,
  shootType: "",
  packageId: "",
  addonIds: [],
  date: "",
  timeSlot: "",
  locationType: "client_choice",
  locationAddress: "",
  name: "",
  email: "",
  phone: "",
  specialNotes: "",
  sessionId: crypto.randomUUID(),
});

// ── Per-step Zod schemas ───────────────────────────────────────────────────
const step6Schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(7, "Please enter your phone number"),
  specialNotes: z.string().optional(),
});

// ── Time slot helpers ──────────────────────────────────────────────────────
function generateSlots(dateStr: string) {
  if (!dateStr) return [];
  const slots = [];
  for (let h = 9; h <= 18; h++) {
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`;
    slots.push({ value: `${h}:00`, label });
  }
  return slots;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isWeekend(dateStr: string) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T12:00:00").getDay();
  return d === 0 || d === 6;
}

const today = new Date().toISOString().split("T")[0];
const STEPS = ["Session Type", "Package", "Add-ons", "Date & Time", "Location", "Your Info", "Review"];

// ── Main component ─────────────────────────────────────────────────────────
export default function BookPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft>(defaultDraft);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setDraft(JSON.parse(saved) as BookingDraft);
    } catch {}
    setHydrated(true);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (hydrated) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const goTo = useCallback((step: number) => update({ step }), [update]);
  const next = useCallback(() => update({ step: Math.min(draft.step + 1, 7) }), [draft.step, update]);
  const back = useCallback(() => update({ step: Math.max(draft.step - 1, 1) }), [draft.step, update]);

  const quote = computeQuote(draft.packageId, draft.addonIds, draft.date);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const locationStr =
        draft.locationType === "studio"
          ? "Studio"
          : draft.locationType === "client_choice"
          ? "Client's choice"
          : draft.locationAddress;

      const pkg = PACKAGES.find((p) => p.id === draft.packageId);
      if (!pkg) throw new Error("Invalid package");

      const startDatetime = new Date(`${draft.date}T${draft.timeSlot}:00`);
      const endDatetime = new Date(startDatetime.getTime() + pkg.durationHours * 3600000);

      const payload = {
        quote_id: draft.sessionId, // Placeholder until backend returns real quote ID
        shoot_type: draft.shootType,
        package_id: draft.packageId,
        addon_ids: draft.addonIds,
        start_time: startDatetime.toISOString(),
        end_time: endDatetime.toISOString(),
        location: locationStr,
        special_notes: draft.specialNotes || null,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
      };

      let bookingId = "demo";
      try {
        const result = (await submitBooking(payload)) as { id: string };
        bookingId = result.id;
      } catch {
        // Backend not connected — proceed to confirmation with demo ID
        bookingId = "demo";
      }

      sessionStorage.removeItem(STORAGE_KEY);
      router.push(`/book/confirmation/${bookingId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-primary text-secondary ${mono.className}`}>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-primary/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done = n < draft.step;
            const active = n === draft.step;
            return (
              <div key={label} className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => done && goTo(n)}
                  disabled={!done}
                  className={`flex items-center gap-2 text-xs tracking-[1px] transition-colors ${
                    active ? semibold.className + " text-white" : done ? "text-white/60 cursor-pointer hover:text-white" : "text-white/25 cursor-default"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 transition-colors ${
                      active ? "bg-white text-black" : done ? "bg-white/20 text-white" : "bg-white/5 text-white/30"
                    }`}
                  >
                    {done ? "✓" : n}
                  </span>
                  <span className="hidden sm:block">{label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="text-white/20 mx-1">›</span>
                )}
              </div>
            );
          })}
        </div>
        {/* Progress fill */}
        <div className="h-0.5 bg-white/5">
          <div
            className="h-full bg-white/60 transition-all duration-300"
            style={{ width: `${((draft.step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Layout ────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-10 flex gap-8 items-start">

        {/* Form area */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <p className="text-xs tracking-[4px] text-white/40 mb-1">STEP {draft.step} OF 7</p>
            <h1 className={`text-2xl sm:text-3xl ${bold.className}`}>{STEPS[draft.step - 1]}</h1>
          </div>

          {draft.step === 1 && (
            <Step1 value={draft.shootType} onChange={(v) => { update({ shootType: v }); next(); }} />
          )}
          {draft.step === 2 && (
            <Step2 value={draft.packageId} onChange={(v) => { update({ packageId: v }); next(); }} onBack={back} />
          )}
          {draft.step === 3 && (
            <Step3 value={draft.addonIds} onChange={(v) => update({ addonIds: v })} onNext={next} onBack={back} />
          )}
          {draft.step === 4 && (
            <Step4 date={draft.date} timeSlot={draft.timeSlot} onChange={(p) => update(p)} onNext={next} onBack={back} />
          )}
          {draft.step === 5 && (
            <Step5
              locationType={draft.locationType}
              address={draft.locationAddress}
              onChange={(p) => update(p)}
              onNext={next}
              onBack={back}
            />
          )}
          {draft.step === 6 && (
            <Step6
              name={draft.name}
              email={draft.email}
              phone={draft.phone}
              notes={draft.specialNotes}
              onChange={(p) => update(p)}
              onNext={next}
              onBack={back}
            />
          )}
          {draft.step === 7 && (
            <StepReview
              draft={draft}
              quote={quote}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onSubmit={handleSubmit}
              onBack={back}
              onEdit={goTo}
            />
          )}
        </div>

        {/* Quote panel — desktop */}
        <div className="hidden lg:block w-72 shrink-0">
          <QuotePanel draft={draft} quote={quote} />
        </div>
      </div>

      {/* Quote panel — mobile (bottom) */}
      {draft.packageId && draft.step < 7 && (
        <div className="lg:hidden sticky bottom-0 border-t border-white/10 bg-primary/95 backdrop-blur px-4 py-3">
          <QuotePanelMini quote={quote} />
        </div>
      )}
    </div>
  );
}

// ── Step 1: Shoot type ─────────────────────────────────────────────────────
function Step1({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SHOOT_TYPES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`text-left p-6 rounded-xl border transition-all duration-200 ${
            value === t.id ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"
          }`}
        >
          <span className="text-2xl mb-3 block">{t.emoji}</span>
          <p className={`text-base ${semibold.className}`}>{t.name}</p>
          <p className="text-sm text-white/50 mt-1">{t.description}</p>
        </button>
      ))}
    </div>
  );
}

// ── Step 2: Package ────────────────────────────────────────────────────────
function Step2({
  value,
  onChange,
  onBack,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {PACKAGES.map((pkg) => (
        <button
          key={pkg.id}
          onClick={() => onChange(pkg.id)}
          className={`text-left p-6 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
            value === pkg.id ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className={`text-base ${semibold.className}`}>{pkg.name}</p>
              {"popular" in pkg && pkg.popular && (
                <span className="text-xs bg-white text-black px-2 py-0.5 rounded-full">Popular</span>
              )}
            </div>
            <p className="text-sm text-white/50 mt-0.5">{pkg.description}</p>
            <p className="text-xs text-white/30 mt-2">{pkg.photos} edited photos</p>
          </div>
          <p className={`text-2xl ${bold.className} shrink-0`}>${pkg.price}</p>
        </button>
      ))}
      <NavRow onBack={onBack} onNext={value ? undefined : undefined} hideNext />
    </div>
  );
}

// ── Step 3: Add-ons ────────────────────────────────────────────────────────
function Step3({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-white/50 -mt-4 mb-2">Optional — select any that apply</p>
      {ADDONS.map((addon) => {
        const selected = value.includes(addon.id);
        return (
          <button
            key={addon.id}
            onClick={() => toggle(addon.id)}
            className={`text-left p-5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
              selected ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected ? "bg-white border-white" : "border-white/30"
                }`}
              >
                {selected && <span className="text-black text-xs font-bold">✓</span>}
              </div>
              <div>
                <p className={`text-sm ${semibold.className}`}>{addon.name}</p>
                <p className="text-xs text-white/50 mt-0.5">{addon.detail}</p>
              </div>
            </div>
            <p className={`text-lg ${semibold.className} shrink-0`}>+${addon.price}</p>
          </button>
        );
      })}
      <NavRow onBack={onBack} onNext={onNext} nextLabel="Continue" />
    </div>
  );
}

// ── Step 4: Date & Time ────────────────────────────────────────────────────
function Step4({
  date,
  timeSlot,
  onChange,
  onNext,
  onBack,
}: {
  date: string;
  timeSlot: string;
  onChange: (p: Partial<BookingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const slots = generateSlots(date);
  const weekend = isWeekend(date);
  const canNext = !!date && !!timeSlot;

  return (
    <div className="flex flex-col gap-6">
      {/* Date */}
      <div>
        <label className="block text-sm text-white/70 mb-2">Select a date</label>
        <input
          type="date"
          value={date}
          min={today}
          onChange={(e) => onChange({ date: e.target.value, timeSlot: "" })}
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-white focus:outline-none focus:border-white/40 w-full sm:w-auto [color-scheme:dark]"
        />
        {weekend && date && (
          <p className="text-amber-400 text-xs mt-2">
            Weekend booking — a 15% surcharge applies.
          </p>
        )}
      </div>

      {/* Time slots */}
      {date && (
        <div>
          <label className="block text-sm text-white/70 mb-3">Select a start time</label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.value}
                onClick={() => onChange({ timeSlot: slot.value })}
                className={`py-2.5 rounded-lg border text-sm transition-colors ${
                  timeSlot === slot.value
                    ? "border-white bg-white/15 font-semibold"
                    : "border-white/15 hover:border-white/40"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-3">
            All slots are in Pacific Time. Duration is set by your chosen package.
          </p>
        </div>
      )}

      <NavRow onBack={onBack} onNext={canNext ? onNext : undefined} nextLabel="Continue" />
    </div>
  );
}

// ── Step 5: Location ───────────────────────────────────────────────────────
function Step5({
  locationType,
  address,
  onChange,
  onNext,
  onBack,
}: {
  locationType: BookingDraft["locationType"];
  address: string;
  onChange: (p: Partial<BookingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const options: { id: BookingDraft["locationType"]; label: string; detail: string }[] = [
    { id: "client_choice", label: "Client's choice", detail: "You pick the spot, I bring the gear" },
    { id: "studio", label: "Studio / Indoor", detail: "Discuss a studio setup during confirmation" },
    { id: "custom", label: "Specific address", detail: "Enter a location and I'll confirm travel" },
  ];
  const canNext = locationType !== "custom" || address.trim().length > 3;

  return (
    <div className="flex flex-col gap-4">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange({ locationType: opt.id })}
          className={`text-left p-5 rounded-xl border transition-all duration-200 ${
            locationType === opt.id ? "border-white bg-white/10" : "border-white/15 hover:border-white/40"
          }`}
        >
          <p className={`text-sm ${semibold.className}`}>{opt.label}</p>
          <p className="text-xs text-white/50 mt-0.5">{opt.detail}</p>
        </button>
      ))}

      {locationType === "custom" && (
        <input
          type="text"
          value={address}
          onChange={(e) => onChange({ locationAddress: e.target.value })}
          placeholder="e.g. Santa Monica Pier, Santa Monica CA"
          className="px-4 py-3 rounded-lg bg-white/5 border border-white/15 text-white placeholder-white/25 focus:outline-none focus:border-white/40 w-full"
        />
      )}

      <NavRow onBack={onBack} onNext={canNext ? onNext : undefined} nextLabel="Continue" />
    </div>
  );
}

// ── Step 6: Contact info ───────────────────────────────────────────────────
function Step6({
  name,
  email,
  phone,
  notes,
  onChange,
  onNext,
  onBack,
}: {
  name: string;
  email: string;
  phone: string;
  notes: string;
  onChange: (p: Partial<BookingDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof step6Schema>>({
    resolver: zodResolver(step6Schema),
    defaultValues: { name, email, phone, specialNotes: notes },
  });

  const onValid = (data: z.infer<typeof step6Schema>) => {
    onChange({ name: data.name, email: data.email, phone: data.phone, specialNotes: data.specialNotes ?? "" });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onValid)} className="flex flex-col gap-5" noValidate>
      <div className="grid sm:grid-cols-2 gap-5">
        <FormField label="Full name" error={errors.name?.message}>
          <input {...register("name")} placeholder="Jane Smith" className={inputCls(!!errors.name)} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input {...register("email")} type="email" placeholder="jane@example.com" className={inputCls(!!errors.email)} />
        </FormField>
      </div>
      <FormField label="Phone number" error={errors.phone?.message}>
        <input {...register("phone")} type="tel" placeholder="(555) 123-4567" className={inputCls(!!errors.phone)} />
      </FormField>
      <FormField label="Special notes (optional)">
        <textarea
          {...register("specialNotes")}
          rows={3}
          placeholder="Any details about the shoot, wardrobe ideas, special requests..."
          className={`${inputCls(false)} resize-none`}
        />
      </FormField>
      <NavRow onBack={onBack} onNext={undefined} nextLabel="Review Booking" isSubmit />
    </form>
  );
}

// ── Step 7: Review ─────────────────────────────────────────────────────────
function StepReview({
  draft,
  quote,
  isSubmitting,
  submitError,
  onSubmit,
  onBack,
  onEdit,
}: {
  draft: BookingDraft;
  quote: ReturnType<typeof computeQuote>;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
}) {
  const pkg = PACKAGES.find((p) => p.id === draft.packageId);
  const selectedAddons = ADDONS.filter((a) => draft.addonIds.includes(a.id));
  const shootType = SHOOT_TYPES.find((t) => t.id === draft.shootType);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-white/50">Review your booking before submitting.</p>

      {/* Summary cards */}
      {[
        { label: "Session Type", value: shootType?.name, step: 1 },
        { label: "Package", value: pkg ? `${pkg.name} — $${pkg.price}` : "", step: 2 },
        { label: "Add-ons", value: selectedAddons.length ? selectedAddons.map((a) => a.name).join(", ") : "None", step: 3 },
        { label: "Date & Time", value: draft.date ? `${formatDate(draft.date)} at ${draft.timeSlot}` : "", step: 4 },
        {
          label: "Location",
          value:
            draft.locationType === "studio"
              ? "Studio / Indoor"
              : draft.locationType === "client_choice"
              ? "Client's choice"
              : draft.locationAddress,
          step: 5,
        },
        { label: "Contact", value: `${draft.name} · ${draft.email} · ${draft.phone}`, step: 6 },
      ].map(({ label, value, step }) => (
        <div key={label} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-white/10">
          <div>
            <p className="text-xs text-white/40 tracking-[2px]">{label.toUpperCase()}</p>
            <p className={`text-sm mt-0.5 ${semibold.className}`}>{value || "—"}</p>
          </div>
          <button
            onClick={() => onEdit(step)}
            className="text-xs text-white/30 hover:text-white transition-colors shrink-0 mt-0.5"
          >
            edit
          </button>
        </div>
      ))}

      {/* Quote total */}
      {quote && (
        <div className="border border-white/20 rounded-xl p-5 bg-white/5">
          <p className="text-xs text-white/40 tracking-[2px] mb-3">ESTIMATED TOTAL</p>
          {quote.lineItems.map((li) => (
            <div key={li.label} className="flex justify-between text-sm mb-1.5">
              <span className="text-white/70">{li.label}</span>
              <span>${li.amount}</span>
            </div>
          ))}
          {quote.modifiers.map((m) => (
            <div key={m.label} className="flex justify-between text-sm mb-1.5 text-amber-400">
              <span>{m.label}</span>
              <span>+${m.amount}</span>
            </div>
          ))}
          <div className={`flex justify-between mt-3 pt-3 border-t border-white/10 ${bold.className}`}>
            <span>Total</span>
            <span>${quote.total}</span>
          </div>
          <p className="text-xs text-white/30 mt-2">
            * Final price confirmed by Rishik. Deposit details sent on confirmation.
          </p>
        </div>
      )}

      {draft.specialNotes && (
        <div className="text-sm text-white/50 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/30 tracking-[2px] mb-1">YOUR NOTES</p>
          <p>{draft.specialNotes}</p>
        </div>
      )}

      {submitError && (
        <p className="text-red-400 text-sm border border-red-400/20 rounded-lg p-3">{submitError}</p>
      )}

      <div className="flex gap-3 mt-2">
        <button onClick={onBack} className="px-5 py-3 border border-white/20 rounded-lg text-sm hover:bg-white/5 transition-colors">
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`flex-1 py-3 rounded-lg text-sm transition-colors ${semibold.className} tracking-[1px] ${
            isSubmitting ? "bg-white/20 text-white/40" : "bg-white text-black hover:bg-stone-100"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit Booking Request"}
        </button>
      </div>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────
function NavRow({
  onBack,
  onNext,
  nextLabel = "Continue",
  isSubmit = false,
  hideNext = false,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
  isSubmit?: boolean;
  hideNext?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-4">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-3 border border-white/20 rounded-lg text-sm hover:bg-white/5 transition-colors"
      >
        Back
      </button>
      {!hideNext && (
        <button
          type={isSubmit ? "submit" : "button"}
          onClick={isSubmit ? undefined : onNext}
          disabled={!isSubmit && !onNext}
          className={`flex-1 py-3 rounded-lg text-sm transition-colors ${semibold.className} tracking-[1px] ${
            isSubmit || onNext
              ? "bg-white text-black hover:bg-stone-100"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-white/70">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-3 rounded-lg bg-white/5 border text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors ${
    hasError ? "border-red-500/50" : "border-white/10 hover:border-white/20"
  }`;
}

// ── Quote panel ────────────────────────────────────────────────────────────
function QuotePanel({ draft, quote }: { draft: BookingDraft; quote: ReturnType<typeof computeQuote> }) {
  const pkg = PACKAGES.find((p) => p.id === draft.packageId);

  return (
    <div className="border border-white/10 rounded-xl p-6 bg-white/3 sticky top-24">
      <p className={`text-xs tracking-[3px] text-white/40 mb-5 ${mono.className}`}>YOUR QUOTE</p>

      {!pkg ? (
        <p className="text-sm text-white/30">Select a package to see pricing</p>
      ) : (
        <>
          <div className="flex flex-col gap-2.5 text-sm">
            {quote?.lineItems.map((li) => (
              <div key={li.label} className="flex justify-between">
                <span className="text-white/60">{li.label}</span>
                <span>${li.amount}</span>
              </div>
            ))}
            {quote?.modifiers.map((m) => (
              <div key={m.label} className="flex justify-between text-amber-400">
                <span>{m.label}</span>
                <span>+${m.amount}</span>
              </div>
            ))}
          </div>

          <div className={`flex justify-between mt-4 pt-4 border-t border-white/10 ${bold.className}`}>
            <span>Estimated Total</span>
            <span>${quote?.total ?? 0}</span>
          </div>
          <p className="text-xs text-white/30 mt-2">Confirmed by Rishik after submission</p>
        </>
      )}
    </div>
  );
}

function QuotePanelMini({ quote }: { quote: ReturnType<typeof computeQuote> }) {
  if (!quote) return null;
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-white/40 tracking-[2px]">ESTIMATED TOTAL</p>
      <p className={`text-lg ${bold.className}`}>${quote.total}</p>
    </div>
  );
}
