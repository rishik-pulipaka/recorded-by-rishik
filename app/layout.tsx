import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    template: "%s | Recorded by Rishik",
    default: "Recorded by Rishik | Photography",
  },
  description:
    "Professional photography in Los Angeles — portraits, headshots, events, and more. Book your session online.",
  openGraph: {
    siteName: "Recorded by Rishik",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-primary flex flex-col min-h-svh">
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
