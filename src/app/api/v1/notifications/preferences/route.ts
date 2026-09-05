import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, executeMutation } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getVapidPublicKey } from '@/lib/notifications/push';

export const dynamic = 'force-dynamic';

async function resolveUserId(request: NextRequest): Promise<{ userId: string; email?: string }> {
  const session = await getSessionFromRequest(request);
  if (session?.userId) return { userId: session.userId, email: session.email };

  const users = await executeQuery<any>(`SELECT id, email FROM users ORDER BY created_at DESC LIMIT 1`);
  if (users.length > 0) return { userId: users[0].id, email: users[0].email };

  const defaultId = 'usr_sukhad_default_demo';
  const defaultEmail = 'sukhad@growwpulse.local';

  try {
    await executeMutation(
      `INSERT INTO users (id, auth_provider_id, email, password_hash)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [defaultId, 'demo_sukhad', defaultEmail, 'mock_hash']
    );
  } catch (e) {
    // Ignore if already created
  }

  return { userId: defaultId, email: defaultEmail };
}

export async function GET(request: NextRequest) {
  try {
    const { userId, email } = await resolveUserId(request);
    const prefs = await executeQuery<any>(
      `SELECT * FROM user_notification_preferences WHERE user_id = $1`,
      [userId]
    );

    let userPrefs = prefs[0];
    if (!userPrefs) {
      await executeMutation(
        `INSERT INTO user_notification_preferences 
         (user_id, email_enabled, email_address, digest_frequency, calm_state_emails, push_enabled, push_calm_state, quiet_hours_start, quiet_hours_end)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, true, email || 'sukhad@growwpulse.local', 'AFTERNOON_DIGEST', true, true, false, '22:00', '08:00']
      );
      userPrefs = {
        user_id: userId,
        email_enabled: true,
        email_address: email || 'sukhad@growwpulse.local',
        digest_frequency: 'AFTERNOON_DIGEST',
        calm_state_emails: true,
        push_enabled: true,
        push_calm_state: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      };
    }

    return NextResponse.json({
      success: true,
      preferences: {
        userId: userPrefs.user_id,
        emailEnabled: Boolean(userPrefs.email_enabled),
        emailAddress: userPrefs.email_address,
        digestFrequency: userPrefs.digest_frequency,
        calmStateEmails: Boolean(userPrefs.calm_state_emails),
        pushEnabled: Boolean(userPrefs.push_enabled),
        pushCalmState: Boolean(userPrefs.push_calm_state),
        quietHoursStart: userPrefs.quiet_hours_start,
        quietHoursEnd: userPrefs.quiet_hours_end,
      },
      vapidPublicKey: getVapidPublicKey(),
    });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, email } = await resolveUserId(request);
    const body = await request.json();
    const {
      emailEnabled,
      emailAddress,
      digestFrequency,
      calmStateEmails,
      pushEnabled,
      pushCalmState,
      quietHoursStart,
      quietHoursEnd,
    } = body;

    await executeMutation(
      `INSERT INTO user_notification_preferences 
       (user_id, email_enabled, email_address, digest_frequency, calm_state_emails, push_enabled, push_calm_state, quiet_hours_start, quiet_hours_end, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id) DO UPDATE SET
         email_enabled = EXCLUDED.email_enabled,
         email_address = EXCLUDED.email_address,
         digest_frequency = EXCLUDED.digest_frequency,
         calm_state_emails = EXCLUDED.calm_state_emails,
         push_enabled = EXCLUDED.push_enabled,
         push_calm_state = EXCLUDED.push_calm_state,
         quiet_hours_start = EXCLUDED.quiet_hours_start,
         quiet_hours_end = EXCLUDED.quiet_hours_end,
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        emailEnabled !== undefined ? emailEnabled : true,
        emailAddress || email || 'sukhad@growwpulse.local',
        digestFrequency || 'AFTERNOON_DIGEST',
        calmStateEmails !== undefined ? calmStateEmails : true,
        pushEnabled !== undefined ? pushEnabled : true,
        pushCalmState !== undefined ? pushCalmState : false,
        quietHoursStart || '22:00',
        quietHoursEnd || '08:00',
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
