import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth/session';
import { PulseService } from '@/lib/services/pulse.service';
import { sendPulseEmailDigest } from '@/lib/notifications/brevo';
import { sendWebPushToUser } from '@/lib/notifications/push';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    let userId = session?.userId;

    if (!userId) {
      const users = await executeQuery<any>(`SELECT id FROM users ORDER BY created_at DESC LIMIT 1`);
      if (users.length > 0) {
        userId = users[0].id;
      }
    }

    if (!userId) {
      const allWl = await executeQuery<any>(`SELECT user_id FROM watchlists LIMIT 1`);
      if (allWl.length > 0) {
        userId = allWl[0].user_id;
      }
    }

    if (!userId) {
      userId = 'usr_sukhad_default_demo';
    }

    const body = await request.json().catch(() => ({}));
    const { targetEmail, force = false } = body;

    // 1. Fetch user preferences
    const prefsRows = await executeQuery<any>(
      `SELECT * FROM user_notification_preferences WHERE user_id = $1`,
      [userId]
    );
    const prefs = prefsRows[0] || {
      email_enabled: true,
      email_address: targetEmail || session?.email || 'sukhad@growwpulse.local',
      calm_state_emails: true,
      push_enabled: true,
      push_calm_state: false,
    };

    const recipientEmail = targetEmail || prefs.email_address || session?.email || 'sukhad@growwpulse.local';

    // 2. Fetch primary watchlist
    let watchlists = await executeQuery<any>(
      `SELECT id, name FROM watchlists WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    
    if (!watchlists.length) {
      watchlists = await executeQuery<any>(`SELECT id, name, user_id FROM watchlists LIMIT 1`);
      if (watchlists.length) {
        userId = watchlists[0].user_id;
      }
    }

    if (!watchlists.length) {
      return NextResponse.json({ success: false, error: 'No watchlist found. Please add stocks to your watchlist first.' }, { status: 404 });
    }

    const watchlistId = watchlists[0].id;
    const finalUserId: string = String(userId || 'usr_sukhad_default_demo');

    // 3. Compute live pulse state
    const pulseResult = await PulseService.getLivePulse({
      userId: finalUserId,
      watchlistId,
    });

    const attentionCount = pulseResult.summary.attentionCount;
    const isCalmState = attentionCount === 0;

    const emailSent = { attempted: false, success: false, messageId: '' };
    const pushSent = { attempted: false, delivered: 0, failed: 0 };

    // Format human duration
    const absenceMinutes = pulseResult.summary.awayDurationMinutes;
    const formattedDuration = absenceMinutes < 60
      ? `${absenceMinutes}m`
      : `${Math.floor(absenceMinutes / 60)}h ${absenceMinutes % 60}m`;

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // 4. Send Email if enabled
    if (prefs.email_enabled && (force || !isCalmState || prefs.calm_state_emails)) {
      emailSent.attempted = true;
      const attentionItems = pulseResult.rankedEvents.map(e => ({
        symbol: e.symbol,
        companyName: e.symbol,
        changePct: e.returnPercent,
        currentPrice: e.evaluationPrice,
        explanation: e.explanation,
        watchReason: e.watchReason,
      }));

      const emailRes = await sendPulseEmailDigest({
        toEmail: recipientEmail,
        subject: isCalmState 
          ? `GrowwPulse: All quiet across your watchlist (${formattedDuration} away)`
          : `GrowwPulse: ${attentionCount} unusual move${attentionCount > 1 ? 's' : ''} detected`,
        headline: pulseResult.summary.marketHeadline || (isCalmState ? '0 stocks moved outside normal bounds' : `${attentionCount} stocks deserve your attention`),
        absenceDuration: formattedDuration,
        attentionItems: attentionItems,
        calmSummary: isCalmState ? "None of your watchlist stocks made unusual or statistically significant moves during your absence." : undefined,
        dashboardUrl: `${origin}/dashboard`,
      });

      emailSent.success = emailRes.success;
      emailSent.messageId = emailRes.messageId || '';
    }

    // 5. Send Web Push if enabled
    if (prefs.push_enabled && (force || !isCalmState || prefs.push_calm_state)) {
      pushSent.attempted = true;
      const pushTitle = isCalmState
        ? `GrowwPulse: All Quiet`
        : `GrowwPulse: ${attentionCount} Unusual Move${attentionCount > 1 ? 's' : ''}`;
      
      const pushBody = isCalmState
        ? `Market moved, but nothing in your watchlist requires attention (${formattedDuration} away).`
        : pulseResult.rankedEvents.map(e => `${e.symbol} ${e.returnPercent >= 0 ? '+' : ''}${e.returnPercent}%`).join(', ');

      const pushRes = await sendWebPushToUser(finalUserId, {
        title: pushTitle,
        body: pushBody,
        url: '/dashboard',
      });

      pushSent.delivered = pushRes.delivered;
      pushSent.failed = pushRes.failed;
    }

    return NextResponse.json({
      success: true,
      message: 'Digest evaluation processed successfully',
      stats: {
        attentionCount,
        isCalmState,
        emailSent,
        pushSent,
      }
    });
  } catch (error: any) {
    console.error('Error triggering digest notification:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
