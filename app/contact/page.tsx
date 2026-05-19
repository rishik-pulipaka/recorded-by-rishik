"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Montserrat } from "next/font/google";
import { submitContactForm } from "@/lib/api";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });
const bold = Montserrat({ subsets: ["latin"], weight: "800" });

const schema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Please enter a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    setStatus("loading");
    try {
      await submitContactForm(data);
      setStatus("success");
      reset();
    } catch {
      // If backend isn't connected yet, treat as success in dev
      if (!process.env.NEXT_PUBLIC_API_URL) {
        setStatus("success");
        reset();
      } else {
        setStatus("error");
      }
    }
  };

  return (
    <div className={`text-secondary min-h-[80vh] ${mono.className}`}>
      <div className="max-w-2xl mx-auto px-4 pt-32 pb-20">

        {/* Header */}
        <div className="mb-12">
          <p className={`text-xs tracking-[5px] text-white/40 mb-3 ${mono.className}`}>GET IN TOUCH</p>
          <h1 className={`text-4xl ${bold.className} mb-4`}>Let&apos;s Talk</h1>
          <p className="text-white/60 leading-relaxed">
            Have a question or want to discuss a project? Send me a message and
            I&apos;ll get back to you within 24 hours.
          </p>
        </div>

        {status === "success" ? (
          <div className="border border-white/20 rounded-xl p-10 text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl">
              ✓
            </div>
            <h2 className={`text-xl ${semibold.className}`}>Message Sent!</h2>
            <p className="text-white/60">
              Thanks for reaching out. I&apos;ll reply within 24 hours.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-2 text-sm text-white/40 hover:text-white transition-colors"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            {/* Name + Email */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Your name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  placeholder="Jane Smith"
                  className={inputCls(!!errors.name)}
                />
              </Field>
              <Field label="Email address" error={errors.email?.message}>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="jane@example.com"
                  className={inputCls(!!errors.email)}
                />
              </Field>
            </div>

            {/* Phone + Subject */}
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Phone (optional)">
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="(555) 123-4567"
                  className={inputCls(false)}
                />
              </Field>
              <Field label="Subject" error={errors.subject?.message}>
                <input
                  {...register("subject")}
                  placeholder="Portrait session inquiry"
                  className={inputCls(!!errors.subject)}
                />
              </Field>
            </div>

            {/* Message */}
            <Field label="Message" error={errors.message?.message}>
              <textarea
                {...register("message")}
                rows={6}
                placeholder="Tell me about your project, the date you have in mind, and any other details..."
                className={`${inputCls(!!errors.message)} resize-none`}
              />
            </Field>

            {status === "error" && (
              <p className="text-red-400 text-sm">
                Something went wrong. Please try again or email me directly.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className={`w-full py-4 rounded-lg text-sm transition-all ${semibold.className} tracking-[2px] ${
                status === "loading"
                  ? "bg-white/20 text-white/40 cursor-not-allowed"
                  : "bg-white text-black hover:bg-stone-100"
              }`}
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}

        {/* Quick contact */}
        <div className="mt-12 pt-8 border-t border-white/10 grid sm:grid-cols-2 gap-4 text-sm text-white/50">
          <div>
            <p className="text-white/30 text-xs tracking-[3px] mb-1">EMAIL</p>
            <a href="mailto:r.pulipaka18@gmail.com" className="hover:text-white transition-colors">
              r.pulipaka18@gmail.com
            </a>
          </div>
          <div>
            <p className="text-white/30 text-xs tracking-[3px] mb-1">BASED IN</p>
            <p>Los Angeles, CA</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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
