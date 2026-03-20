import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// GET — load comments for a post
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get('postId');
  if (!postId) return Response.json({ error: 'postId required' }, { status: 400 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ comments: data || [] });
}

// POST — add a comment
export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId, content } = await request.json();
  if (!postId || !content?.trim()) {
    return Response.json({ error: 'postId and content required' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('post_comments')
    .insert({
      post_id: postId,
      user_email: session.user.email,
      user_name: session.user.name || session.user.email.split('@')[0],
      user_avatar_color: '#E8451A',
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ comment: data });
}
