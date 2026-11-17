import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

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
          return NextResponse.redirect(`${origin}/profile/setup`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
