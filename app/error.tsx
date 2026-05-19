"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center text-secondary">
      <p className="text-xs tracking-[5px] text-white/40 uppercase">Error</p>
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="text-white/60 max-w-md">
        An unexpected error occurred. Please try again, or contact me if the
        problem persists.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-3 border border-white/20 rounded-lg text-sm hover:bg-white/5 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-white text-black rounded-lg text-sm hover:bg-stone-100 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
