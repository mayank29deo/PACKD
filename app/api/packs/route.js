import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load all pack memberships for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('pack_memberships')
    .select('pack_id')
    .eq('user_email', session.user.email);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Return as { [packId]: true } map
  const joined = {};
  (data || []).forEach((r) => { joined[r.pack_id] = true; });
  return Response.json({ joined });
}

// POST — join a pack
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packId } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase.from('pack_memberships').upsert(
    { user_email: session.user.email, pack_id: packId },
    { onConflict: 'user_email,pack_id' }
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

// DELETE — leave a pack
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packId } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('pack_memberships')
    .delete()
    .eq('user_email', session.user.email)
    .eq('pack_id', packId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
