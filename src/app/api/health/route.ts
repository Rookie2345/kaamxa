import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // Trivial query against reference table (provinces) to keep Supabase awake
    const { data, error } = await supabase.from('provinces').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'degraded',
          message: 'Supabase ping failed or not configured yet',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      service: 'KaamXa',
      supabase: 'connected',
      rowsFound: data?.length ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: err.message || 'Internal health check error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
