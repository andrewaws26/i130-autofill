import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Only activate Clerk middleware if the secret key is configured
const clerkConfigured = !!process.env.CLERK_SECRET_KEY;

// Routes that require Clerk authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/clients',
  '/cases',
  '/documents',
  '/calendar',
  '/billing',
  '/api/clients',
  '/api/cases',
  '/api/documents',
  '/api/billing',
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Demo routes are always public
  if (path.startsWith('/demo')) {
    return NextResponse.next();
  }

  // If Clerk isn't configured, skip auth entirely
  if (!clerkConfigured) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Dynamically import Clerk middleware only when needed
  try {
    const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');
    const isProtectedRoute = createRouteMatcher(PROTECTED_PREFIXES.map((p) => p + '(.*)'));
    const handler = clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
    });
    return handler(req, {} as never);
  } catch {
    // If Clerk fails, allow access (dev mode without Clerk)
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
