// Sign-in page — loads Clerk dynamically to prevent build crashes when Clerk keys are placeholder values
"use client";
import dynamic from "next/dynamic";

const ClerkSignIn = dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.SignIn })), { ssr: false });

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ClerkSignIn />
    </div>
  )
}
