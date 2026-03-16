import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { createServerSupabase } from '../../../../lib/supabase';

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '7'), 30);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('meal_logs')
    .select('id, meal_name, total_calories, protein_g, carbs_g, fat_g, confidence, logged_at')
    .eq('user_email', session.user.email)
    .gte('logged_at', since.toISOString())
    .order('logged_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, data: data || [] });
}
