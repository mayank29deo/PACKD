import Razorpay from 'razorpay';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ error: 'Sign in to RSVP for paid events' }, { status: 401 });
    }

    const { eventId, eventTitle, amount } = await request.json();

    if (!eventId || !amount || amount <= 0) {
      return Response.json({ error: 'Invalid event or amount' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount:   amount * 100, // paise
      currency: 'INR',
      receipt:  `packd_${eventId}_${Date.now()}`,
      notes: {
        eventId,
        eventTitle,
        userEmail: session.user.email,
      },
    });

    return Response.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('Create order error:', err);
    return Response.json({ error: err.message || 'Failed to create order' }, { status: 500 });
  }
}
