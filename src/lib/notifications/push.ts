// Web Push Notification Service using VAPID
import webpush from 'web-push';
import { executeQuery } from '@/lib/db';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEAXYZDU_uqD_a04UwSfUbtVWHnpGd8k1ApSZ-1w8WVKq8Scp4foBiLnVnwuC0YOUGShkjpfgDSuikIvXYPDFXY';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'EApHI44Ug_fZca30JLO-8qvuGIjw7KTaDqG4Zv7gfaU';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:mail@sukhad.dev';

try {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} catch (err) {
  console.warn('[WebPush] VAPID details initialization note:', err);
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export async function sendWebPushToUser(userId: string, payload: PushNotificationPayload): Promise<{ delivered: number; failed: number }> {
  try {
    const subscriptions = await executeQuery<any>(
      `SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = $1`,
      [userId]
    );

    let delivered = 0;
    let failed = 0;

    const pushPayloadString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/dashboard',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge.png',
      tag: payload.tag || 'groww-pulse-digest',
    });

    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh_key,
          auth: sub.auth_key,
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, pushPayloadString);
        delivered++;
      } catch (err: any) {
        console.warn(`[WebPush] Failed sending to endpoint ${sub.endpoint}:`, err?.message || err);
        failed++;
        // If expired or gone (404/410), cleanup dead subscription
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await executeQuery(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]);
        }
      }
    }

    return { delivered, failed };
  } catch (err) {
    console.error('[WebPush] sendWebPushToUser error:', err);
    return { delivered: 0, failed: 0 };
  }
}

export function getVapidPublicKey(): string {
  return vapidPublicKey;
}
