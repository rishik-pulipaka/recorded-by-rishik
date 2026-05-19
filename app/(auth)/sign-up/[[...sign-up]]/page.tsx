import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-151px)] items-center justify-center py-16 px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border border-white/10 bg-[#1a1a1a]",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton:
              "border-white/20 text-white hover:bg-white/10",
            dividerLine: "bg-white/10",
            dividerText: "text-gray-500",
            formFieldLabel: "text-gray-300",
            formFieldInput:
              "bg-white/5 border-white/20 text-white placeholder-gray-500",
            footerActionLink: "text-stone-300 hover:text-white",
            formButtonPrimary: "bg-stone-600 hover:bg-stone-500",
          },
        }}
      />
    </div>
  );
}
