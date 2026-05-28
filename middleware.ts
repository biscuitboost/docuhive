// Middleware — no-op. Route protection is handled client-side via Clerk's
// <Protect> component and <SignedIn>/<SignedOut> gates.
// The Clerk Edge SDK has cold-start import issues on Vercel's edge runtime,
// so we keep middleware minimal until that's resolved.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
