export interface SendPushParams {
  title: string;
  message: string;
  url?: string;
  icon?: string;
  apiKey?: string;
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

export async function sendPushAlert({
  title,
  message,
  url = 'https://campusguide.ng',
  icon = 'https://campusguide.ng/icon-192x192.png',
  apiKey,
}: SendPushParams) {
  const keyToUse = (apiKey || getStoredPushAlertApiKey()).trim();
  if (!keyToUse) {
    throw new Error('PushAlert API Key is missing. Please enter your API Key.');
  }

  const formData = new URLSearchParams();
  formData.append('title', title.trim());
  formData.append('message', message.trim());
  if (url) formData.append('url', url.trim());
  if (icon) formData.append('icon', icon.trim());

  const response = await fetch('/api/pushalert/rest/v1/send', {
    method: 'POST',
    headers: {
      api_key: keyToUse,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || (data && data.success === false)) {
    throw new Error(data?.msg || `Failed to send push notification (Status: ${response.status})`);
  }

  return data;
}
