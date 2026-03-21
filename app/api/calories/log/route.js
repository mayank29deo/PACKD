import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { createServerSupabase } from '../../../../lib/supabase';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { meal, totalCalories, macros, items, confidence, servingNote, athleteTip } =
    await request.json();

  const supabase = createServerSupabase();
  const { error } = await supabase.from('meal_logs').insert({
    user_email:     session.user.email,
    meal_name:      meal,
    total_calories: totalCalories,
    protein_g:      macros?.protein || 0,
    carbs_g:        macros?.carbs   || 0,
    fat_g:          macros?.fat     || 0,
    items:          items   || [],
    confidence:     confidence || 'medium',
    serving_note:   servingNote,
    athlete_tip:    athleteTip,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
