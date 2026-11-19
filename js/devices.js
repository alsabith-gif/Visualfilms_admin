// devices.js — "Devices signed in": plain-words description of a login, and the calls to list / remove them.
// Everything runs through 3 database functions (PART 11) that only ever touch the caller's OWN logins.
import { supabase } from './cloud.js';

// "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 …) … Safari/604.1" -> { device: 'iPhone', browser: 'Safari' }
export function describeDevice(ua) {
  const s = String(ua || '');
  if (!s) return { device: 'Unknown device', browser: '' };
  let device = 'Computer';
  if (/iPhone/i.test(s)) device = 'iPhone';
  else if (/iPad/i.test(s)) device = 'iPad';
  else if (/Android/i.test(s)) device = /Mobile/i.test(s) ? 'Android phone' : 'Android tablet';
  else if (/Windows/i.test(s)) device = 'Windows computer';
  else if (/Macintosh|Mac OS X/i.test(s)) device = 'Mac';
  else if (/Linux|CrOS/i.test(s)) device = 'Linux computer';
  let browser = '';
  if (/EdgiOS|Edg\//i.test(s)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(s)) browser = 'Opera';
  else if (/SamsungBrowser/i.test(s)) browser = 'Samsung Internet';
  else if (/FxiOS|Firefox/i.test(s)) browser = 'Firefox';
  else if (/CriOS|Chrome/i.test(s)) browser = 'Chrome';
  else if (/Safari/i.test(s)) browser = 'Safari';
  return { device, browser };
}

// "just now", "5 min ago", "3 hours ago", "2 days ago", else a date
export function agoText(iso, now = Date.now()) {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '—';
  const m = Math.max(0, Math.round((now - t) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} hour${Math.round(m / 60) === 1 ? '' : 's'} ago`;
  const d = Math.round(m / 1440);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function friendly(err) {
  const msg = (err && err.message) || '';
  if (/Could not find the function|does not exist|schema cache/i.test(msg)) return new Error('The device list is not set up yet — run PART 11 of supabase/worker-setup.sql (SETUP.md, Build 23).');
  return new Error(msg || 'Something went wrong. Try again.');
}

export async function listDevices() {
  const { data, error } = await supabase.rpc('my_sessions');
  if (error) throw friendly(error);
  return data || [];
}
export async function removeDevice(id) {
  const { error } = await supabase.rpc('revoke_session', { p_id: id });
  if (error) throw friendly(error);
}
export async function removeOtherDevices() {
  const { data, error } = await supabase.rpc('revoke_other_sessions');
  if (error) throw friendly(error);
  return Number(data) || 0;
}
