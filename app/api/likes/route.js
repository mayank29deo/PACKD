import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load all post likes for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_email', session.user.email);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Return as { [postId]: true } map
  const likes = {};
  (data || []).forEach((r) => { likes[r.post_id] = true; });
  return Response.json({ likes });
}

// POST — like a post
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase.from('post_likes').upsert(
    { user_email: session.user.email, post_id: postId },
    { onConflict: 'user_email,post_id' }
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}

// DELETE — unlike a post
export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await request.json();
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('user_email', session.user.email)
    .eq('post_id', postId);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
