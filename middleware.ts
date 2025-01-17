import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Allow all requests for now
  return NextResponse.next();
}

export const config = {
  matcher: []  // Empty matcher means no routes will be intercepted
};
