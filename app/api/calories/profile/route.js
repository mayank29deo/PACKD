import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('nutrition_profiles')
    .select('*')
    .eq('user_email', session.user.email)
    .single();

  // PGRST116 = no rows found (not a real error)
  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data: data || null });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('nutrition_profiles')
    .upsert(
      { ...body, user_email: session.user.email, updated_at: new Date().toISOString() },
      { onConflict: 'user_email' }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, data });
}
