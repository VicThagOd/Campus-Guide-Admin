export interface ActionButton {
  title: string; // Max 16 characters
  url: string;
}

export interface SendPushParams {
  title: string; // Max 64 characters
  message: string; // Max 192 characters
  url?: string;
  icon?: string;
  large_image?: string; // Recommended 720x360
  action1?: ActionButton;
  action2?: ActionButton;
  segmentId?: number | string;
  audience_id?: number | string;
  subscriber?: string;
  subscribers?: string[];
  apiKey?: string;
}

export interface PushNotificationResult {
  success: boolean;
  id?: number;
  msg?: string;
}

export interface PushSegment {
  id: number;
  name: string;
  subscribers: number;
}

export interface NotificationStats {
  success: boolean;
  attempted?: number;
  delivered?: number;
  clicked?: number;
  ctr?: string;
  msg?: string;
}

export const getStoredPushAlertApiKey = (): string => {
  return (
    localStorage.getItem('pushalert_api_key') ||
    (import.meta as any).env.VITE_PUSHALERT_API_KEY ||
    ''
  );
};

export const setStoredPushAlertApiKey = (key: string): void => {
  localStorage.setItem('pushalert_api_key', key.trim());
};

/**
 * Send a push notification using PushAlert REST API (/rest/v1/send or /rest/v1/segment/$SEG_ID/send)
 */
export async function sendPushAlert({
  title,
  message,
  url = 'https://campusguide.ng',
  icon = 'https://campusguide.ng/icon-192x192.png',
  large_image,
  action1,
  action2,
  segmentId,
  audience_id,
  subscriber,
  subscribers,
  apiKey,
}: SendPushParams): Promise<PushNotificationResult> {
  const keyToUse = (apiKey || getStoredPushAlertApiKey()).trim();
  if (!keyToUse) {
    throw new Error('PushAlert API Key is missing. Please enter your API Key.');
  }

  // PushAlert documentation restrictions:
  // - title: max 64 characters
  // - message: max 192 characters
  // - action title: max 16 characters
  const cleanTitle = title.trim().slice(0, 64);
  const cleanMessage = message.trim().slice(0, 192);

  if (!cleanTitle) {
    throw new Error('Notification title is required.');
  }
  if (!cleanMessage) {
    throw new Error('Notification message is required.');
  }

  const formData = new URLSearchParams();
  formData.append('title', cleanTitle);
  formData.append('message', cleanMessage);
  if (url) formData.append('url', url.trim());
  if (icon) formData.append('icon', icon.trim());
  if (large_image) formData.append('large_image', large_image.trim());

  if (action1 && action1.title.trim() && action1.url.trim()) {
    formData.append(
      'action1',
      JSON.stringify({
        title: action1.title.trim().slice(0, 16),
        url: action1.url.trim(),
      })
    );
  }

  if (action2 && action2.title.trim() && action2.url.trim()) {
    formData.append(
      'action2',
      JSON.stringify({
        title: action2.title.trim().slice(0, 16),
        url: action2.url.trim(),
      })
    );
  }

  if (audience_id) {
    formData.append('audience_id', String(audience_id));
  }

  if (subscriber) {
    formData.append('subscriber', subscriber.trim());
  } else if (subscribers && subscribers.length > 0) {
    formData.append('subscribers', JSON.stringify(subscribers));
  }

  // Determine endpoint based on segmentId
  const endpoint = segmentId
    ? `/api/pushalert/rest/v1/segment/${segmentId}/send`
    : `/api/pushalert/rest/v1/send`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      // Official PushAlert doc: Authorization: api_key=<insert api key here>
      Authorization: `api_key=${keyToUse}`,
      api_key: keyToUse,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = (await response.json().catch(() => null)) as PushNotificationResult | null;

  if (!response.ok || (data && data.success === false)) {
    throw new Error(data?.msg || `Failed to send push notification (Status: ${response.status})`);
  }

  return data ?? { success: true };
}

/**
 * Fetch subscriber segments from PushAlert (/rest/v1/segments)
 */
export async function getSegments(apiKey?: string): Promise<PushSegment[]> {
  const keyToUse = (apiKey || getStoredPushAlertApiKey()).trim();
  if (!keyToUse) return [];

  try {
    const response = await fetch('/api/pushalert/rest/v1/segments', {
      method: 'GET',
      headers: {
        Authorization: `api_key=${keyToUse}`,
        api_key: keyToUse,
      },
    });

    const data = await response.json().catch(() => null);
    if (data && data.success && Array.isArray(data.segments)) {
      return data.segments;
    }
    return [];
  } catch (err) {
    console.warn('Failed to fetch PushAlert segments:', err);
    return [];
  }
}

/**
 * Fetch delivery & click stats for a sent notification (/rest/v1/info/$ID)
 */
export async function getNotificationStats(
  notificationId: number | string,
  apiKey?: string
): Promise<NotificationStats | null> {
  const keyToUse = (apiKey || getStoredPushAlertApiKey()).trim();
  if (!keyToUse || !notificationId) return null;

  try {
    const response = await fetch(`/api/pushalert/rest/v1/info/${notificationId}`, {
      method: 'GET',
      headers: {
        Authorization: `api_key=${keyToUse}`,
        api_key: keyToUse,
      },
    });

    return await response.json().catch(() => null);
  } catch (err) {
    console.warn('Failed to fetch notification stats:', err);
    return null;
  }
}
