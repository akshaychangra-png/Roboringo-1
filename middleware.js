import { NextResponse } from 'next/server';

// Consolidate legacy enquiry URLs without discarding the visitor's selected topic.
export function middleware(request) {
  if (!request.nextUrl.searchParams.has('subject')) return NextResponse.next();
  const topic = request.nextUrl.searchParams.get('subject').slice(0, 200);
  const destination = request.nextUrl.clone();
  destination.pathname = '/contact';
  destination.searchParams.delete('subject');
  const response = NextResponse.redirect(destination, 308);
  if (topic) response.cookies.set('rr-enquiry-topic', topic, {
    path: '/', maxAge: 600, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:',
  });
  // Redirects carry per-visitor enquiry context; do not cache their Set-Cookie.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/contact', '/contact/'] };
