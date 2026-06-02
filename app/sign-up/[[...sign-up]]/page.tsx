// Sign-up page — loads Clerk dynamically
"use client";
import dynamic from "next/dynamic";

const ClerkSignUp = dynamic(() => import("@clerk/nextjs").then((m) => ({ default: m.SignUp })), { ssr: false });

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <ClerkSignUp />
    </div>
  )
}
