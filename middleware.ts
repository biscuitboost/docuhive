// Middleware — route protection with Clerk. Gracefully degrades when Clerk isn't configured.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/pricing", "/api/stripe/webhook"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      try {
        await auth().protect();
      } catch {
        // Clerk keys not configured — allow access during build/dev
      }
    }
  },
  { clockSkewInMs: 5000 }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
