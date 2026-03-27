import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Demo mode is an exception to route protection since it uses localStorage which edge doesn't see
  // To avoid SSR mismatch, we don't block at middleware level if it's the protected area. 
  // Next.js layout handles the actual rewrite.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
