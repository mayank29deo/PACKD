import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createServerSupabase } from '../../../lib/supabase';

// Allow larger payloads for video uploads
export const maxDuration = 60;

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-m4v': 'm4v',
};

const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const mediaType = formData.get('type'); // 'photo' | 'video'

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Size check
  const maxBytes = mediaType === 'video' ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES;
  if (buffer.byteLength > maxBytes) {
    return Response.json(
      { error: `File too large. Max ${mediaType === 'video' ? '100MB' : '15MB'}.` },
      { status: 413 }
    );
  }

  const ext = MIME_TO_EXT[file.type] || (mediaType === 'video' ? 'mp4' : 'jpg');
  const sanitizedEmail = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${sanitizedEmail}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = createServerSupabase();
  const { error: uploadError } = await supabase.storage
    .from('post-media')
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('post-media')
    .getPublicUrl(fileName);

  return Response.json({ url: publicUrl });
}
