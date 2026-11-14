export const cmToFeet = (cm) => {
  if (!cm) return '';
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
};

export const heightOptions = () => {
  const out = [];
  for (let cm = 137; cm <= 213; cm += 2) out.push({ value: cm, label: `${cmToFeet(cm)} (${cm} cm)` });
  return out;
};

export const timeAgo = (date, lang = 'en') => {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const hi = lang === 'hi';
  if (s < 60) return hi ? 'अभी' : 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return hi ? `${m} मिनट पहले` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return hi ? `${h} घंटे पहले` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return hi ? `${d} दिन पहले` : `${d}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
export const formatTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');
export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
