import { NextRequest, NextResponse } from 'next/server';
import { executeMutation, executeQuery } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    let userId = session?.userId;

    if (!userId) {
      const users = await executeQuery<any>(`SELECT id FROM users ORDER BY created_at DESC LIMIT 1`);
      if (users.length > 0) userId = users[0].id;
    }

    if (!userId) {
      userId = 'usr_sukhad_default_demo';
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription object' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    await executeMutation(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh_key = EXCLUDED.p256dh_key,
         auth_key = EXCLUDED.auth_key,
         created_at = CURRENT_TIMESTAMP`,
      [userId, endpoint, p256dh, auth]
    );

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
    });
  } catch (error: any) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
