import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Tillåt allt under tiden vi kör client-side auth guard.
  // Detta undviker login-loopar när Supabase-sessionen inte ligger i cookies.
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
