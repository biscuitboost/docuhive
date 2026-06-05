// Sign-in page — loads Clerk dynamically with a value-prop split layout
"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { FileText, Shield, Sparkles } from "lucide-react";

const ClerkSignIn = dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.SignIn })), { ssr: false });

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Left: Value prop panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#1a2234] to-[#0f172a] p-12 border-r border-gray-800">
        <div>
          <Link href="/" className="text-lg font-semibold text-white inline-block mb-12">
            <span className="text-blue-400">Docu</span>Hive
          </Link>
          <div className="max-w-md">
            <h2 className="text-2xl font-bold text-white">
              Welcome back
            </h2>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Pick up where you left off. Your documents, templates, and settings
              are all waiting for you.
            </p>
            <div className="mt-8 rounded-xl border border-gray-700 bg-gray-900/50 p-5">
              <p className="text-sm font-medium text-white">Quick stats from your last visit</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Generate compliant UK documents in seconds
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                  Auto-calculate NI, pension, and tax
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
                  ERA 2025 compliant templates
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Shield size="12" />
            Secured by Stripe
          </span>
          <span className="flex items-center gap-1.5">
            <FileText size="12" />
            500+ businesses
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles size="12" />
            AI-powered
          </span>
        </div>
      </div>

      {/* Right: Clerk sign-in form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="text-lg font-semibold text-white">
              <span className="text-blue-400">Docu</span>Hive
            </Link>
            <p className="mt-2 text-sm text-gray-400">
              Sign in to your account
            </p>
          </div>
          <ClerkSignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-[#1a2234] border border-gray-700 shadow-xl shadow-black/20 rounded-xl",
                headerTitle: "text-white text-xl font-semibold",
                headerSubtitle: "text-gray-400 text-sm",
                formButtonPrimary:
                  "bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold py-2.5 px-4 transition-all",
                formFieldLabel: "text-gray-300 text-sm",
                formFieldInput:
                  "bg-gray-800 border-gray-700 text-white rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                dividerLine: "bg-gray-700",
                dividerText: "text-gray-500",
                socialButtonsBlockButton:
                  "border-gray-700 text-gray-300 hover:bg-gray-800 rounded-lg text-sm",
                socialButtonsBlockButtonText: "text-gray-300",
                formFieldInputPlaceholder: "text-gray-500",
                identityPreviewEditButton: "text-blue-400",
                formFieldSuccessText: "text-emerald-400",
                formFieldErrorText: "text-red-400",
              },
            }}
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  );
}