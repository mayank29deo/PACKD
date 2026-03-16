export const runtime = 'nodejs';

import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, eventId } = await request.json();

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return Response.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Payment is verified — optionally log to DB here
    return Response.json({
      success:   true,
      paymentId: razorpay_payment_id,
      eventId,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    return Response.json({ error: err.message || 'Verification failed' }, { status: 500 });
  }
}
