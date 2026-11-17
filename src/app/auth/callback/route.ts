import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  // Support reverse proxy headers on Render, Cloudflare, Docker
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin);

  // Catch OAuth errors passed in query params
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  if (errorParam || errorDescription) {
    const msg = errorDescription || errorParam || 'OAuth failed';
    return NextResponse.redirect(
      `${siteUrl}/login?error_description=${encodeURIComponent(msg)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if user has set up district/phone
        const { data: profile } = await supabase
          .from('profiles')
          .select('district_id')
          .eq('id', user.id)
          .maybeSingle() as { data: { district_id: number | null } | null };

        if (!profile?.district_id) {
          return NextResponse.redirect(`${siteUrl}/profile/setup`);
        }
      }
      return NextResponse.redirect(`${siteUrl}${next}`);
    } else {
      console.error('exchangeCodeForSession error:', error);
      return NextResponse.redirect(
        `${siteUrl}/login?error_description=${encodeURIComponent(error.message)}`
      );
    }
  }

  // Return user to login page with instructions
  return NextResponse.redirect(`${siteUrl}/login?error=auth_callback_failed`);
}
