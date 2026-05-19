import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center text-secondary">
      <p className="text-xs tracking-[5px] text-white/40 uppercase">404</p>
      <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="text-white/60 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-6 py-3 bg-white text-black rounded-lg text-sm hover:bg-stone-100 transition-colors font-semibold"
        >
          Go home
        </Link>
        <Link
          href="/gallery"
          className="px-6 py-3 border border-white/20 rounded-lg text-sm hover:bg-white/5 transition-colors"
        >
          View gallery
        </Link>
      </div>
    </div>
  );
}
