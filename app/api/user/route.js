import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load user profile from Supabase
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single();

  // PGRST116 = row not found — first time this user logs in
  if (error?.code === 'PGRST116') {
    return Response.json({ user: null });
  }
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ user: data });
}

// PUT — upsert user profile (create or update)
export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { email: session.user.email, ...body, updated_at: new Date().toISOString() },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ user: data });
}
