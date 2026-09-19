import React, { useState } from 'react';
import {
  getStoredPushAlertApiKey,
  setStoredPushAlertApiKey,
  sendPushAlert,
} from '../lib/pushAlert';

const PRIMARY = '#2F4EA2';

interface Template {
  name: string;
  badge: string;
  title: string;
  message: string;
  url: string;
}

const TEMPLATES: Template[] = [
  {
    name: 'New Campus Event',
    badge: 'Event',
    title: '?? New Campus Event Announced!',
    message: 'Check out the details and grab your tickets now before slots fill up.',
    url: 'https://campusguide.ng/events',
  },
  {
    name: 'Hostel Accommodation Available',
    badge: 'Housing',
    title: '?? New Accommodation Spaces Available!',
    message: 'Fresh student hostels and self-cons have just been listed around campus.',
    url: 'https://campusguide.ng/accommodation',
  },
  {
    name: 'Important Admission/Registration Update',
    badge: 'Announcement',
    title: '?? Important Update for Aspirants',
    message: 'New guidelines and deadline updates have been posted. Tap to review.',
    url: 'https://campusguide.ng/updates',
  },
  {
    name: 'Post UTME Practice Alert',
    badge: 'CBT',
    title: '?? Time to Practice!',
    message: 'Sharpen your skills with realistic UNIPORT Post UTME mock tests.',
    url: 'https://campusguide.ng/post-utme',
  },
];

export default function PushNotificationsSection() {
  const [apiKey, setApiKey] = useState(getStoredPushAlertApiKey());
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('https://campusguide.ng');
  const [icon, setIcon] = useState('https://campusguide.ng/icon-192x192.png');

  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredPushAlertApiKey(apiKey);
    setSavedKeySuccess(true);
    setTimeout(() => setSavedKeySuccess(false), 3000);
  };

  const handleApplyTemplate = (tpl: Template) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setUrl(tpl.url);
    setFeedback(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const activeKey = apiKey || getStoredPushAlertApiKey();
    if (!activeKey) {
      setFeedback({
        type: 'error',
        text: 'Please enter your PushAlert REST API Key in the settings below.',
      });
      return;
    }

    if (!title.trim() || !message.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please provide both a notification title and message.',
      });
      return;
    }

    setSending(true);
    try {
      await sendPushAlert({
        title,
        message,
        url,
        icon,
        apiKey: activeKey,
      });

      setFeedback({
        type: 'success',
        text: '?? Notification successfully broadcasted to all subscriber phones!',
      });
      // Reset fields
      setTitle('');
      setMessage('');
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to broadcast notification.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Push Notifications Hub</h2>
        <p className="text-sm text-gray-500 mt-1">
          Broadcast instant push notifications directly to students' phone lock screens and desktops.
        </p>
      </div>

      {/* Grid: Form + Live Mobile Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Preset Buttons */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              ? Quick 1-Click Templates
            </p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-[#2F4EA2] hover:bg-blue-50 text-xs font-medium text-gray-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Compose Form */}
          <form onSubmit={handleSend} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>?? Compose Notification</span>
            </h3>

            {feedback && (
              <div
                className={`p-4 rounded-xl text-sm font-medium ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Notification Title (max 80 chars)
              </label>
              <input
                type="text"
                maxLength={80}
                required
                placeholder="e.g. ?? New Campus Event: Freshers Welcome Party!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2F4EA2] focus:ring-2 focus:ring-blue-100 outline-hidden text-sm"
              />
              <span className="text-xs text-gray-400 mt-1 block text-right">{title.length}/80</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Message Body (max 200 chars)
              </label>
              <textarea
                rows={3}
                maxLength={200}
                required
                placeholder="e.g. Tickets are now live! Tap to secure yours before spots fill up."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2F4EA2] focus:ring-2 focus:ring-blue-100 outline-hidden text-sm"
              />
              <span className="text-xs text-gray-400 mt-1 block text-right">{message.length}/200</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Action Link URL
                </label>
                <input
                  type="url"
                  placeholder="https://campusguide.ng/events"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2F4EA2] focus:ring-2 focus:ring-blue-100 outline-hidden text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Notification Icon URL
                </label>
                <input
                  type="url"
                  placeholder="https://campusguide.ng/icon-192x192.png"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2F4EA2] focus:ring-2 focus:ring-blue-100 outline-hidden text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{ backgroundColor: PRIMARY }}
              className="w-full py-3 px-4 rounded-xl text-white font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {sending ? 'Sending Broadcast...' : '?? Send Push Notification to All Subscribers'}
            </button>
          </form>
        </div>

        {/* Right Col: Phone Mockup / Live Preview */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              ?? Live Mobile Lockscreen Preview
            </h4>

            <div className="mx-auto w-full max-w-[280px] rounded-3xl bg-gray-900 p-3 shadow-xl border-4 border-gray-800">
              {/* Phone Speaker Notch */}
              <div className="w-16 h-3.5 bg-gray-800 rounded-full mx-auto mb-4" />

              {/* Notification Banner Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-md border border-white/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <img
                    src={icon || 'https://campusguide.ng/icon-192x192.png'}
                    alt="App"
                    className="w-5 h-5 rounded-md object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://campusguide.ng/icon-192x192.png';
                    }}
                  />
                  <span className="text-[11px] font-bold text-gray-900">Campus Guide</span>
                  <span className="text-[9px] text-gray-400 ml-auto">now</span>
                </div>
                <div className="text-xs font-bold text-gray-900 leading-tight">
                  {title || 'Notification Title'}
                </div>
                <div className="text-[11px] text-gray-600 mt-1 line-clamp-2 leading-snug">
                  {message || 'The notification message body will appear right here on the lock screen.'}
                </div>
              </div>

              {/* Home bar */}
              <div className="w-24 h-1 bg-gray-700 rounded-full mx-auto mt-6 mb-1" />
            </div>
          </div>

          {/* PushAlert Settings Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                ?? PushAlert API Key
              </h4>
              <a
                href="https://pushalert.co/dashboard/1/"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#2F4EA2] hover:underline font-medium"
              >
                Open Dashboard &rarr;
              </a>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Find your API key in PushAlert dashboard under <b>Settings &rarr; REST API</b>.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="password"
                placeholder="Enter PushAlert REST API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:border-[#2F4EA2] outline-hidden font-mono"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save API Key
                </button>
                {savedKeySuccess && (
                  <span className="text-xs text-emerald-600 font-medium">? Saved!</span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
