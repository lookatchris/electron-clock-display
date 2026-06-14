/* global fetch, location */
'use strict';

// ── Helpers ─────────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

let toastTimer = null;
function showToast(message, type = 'info') {
  const el = $('toast');
  el.textContent = message;
  el.className = `toast visible ${type}`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast hidden'; }, 3000);
}

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ── Status bar refresh ───────────────────────────────────────────────────────

async function refreshStatus() {
  try {
    const s = await api('GET', '/api/status');
    populateFields(s);

    $('status-url').textContent       = `URL: ${s.displayUrl || '—'}`;
    $('status-brightness').textContent = `Brightness: ${s.brightness ?? '—'}%`;
    $('status-screen').textContent     = `Screen: ${s.screenOff ? 'Off' : 'On'}`;
  } catch (e) {
    console.error('Status refresh failed:', e);
  }
}

function populateFields(s) {
  if (s.displayUrl)   $('display-url').value = s.displayUrl;
  if (s.brightness != null) {
    $('brightness-slider').value = s.brightness;
    $('brightness-value').textContent = `${s.brightness}%`;
  }

  const ds = s.dimmingSchedule || {};
  $('dim-enabled').checked = !!ds.enabled;
  if (ds.startTime)    $('dim-start').value = ds.startTime;
  if (ds.endTime)      $('dim-end').value   = ds.endTime;
  if (ds.dimmingLevel != null) {
    $('dim-level').value = ds.dimmingLevel;
    $('dim-level-value').textContent = `${ds.dimmingLevel}%`;
  }

  const sos = s.screenOffSchedule || {};
  $('screenoff-enabled').checked = !!sos.enabled;
  if (sos.offTime) $('screenoff-off').value = sos.offTime;
  if (sos.onTime)  $('screenoff-on').value  = sos.onTime;
}

// ── Display URL ──────────────────────────────────────────────────────────────

$('btn-set-url').addEventListener('click', async () => {
  const url = $('display-url').value.trim();
  if (!url) return showToast('Please enter a URL', 'warning');
  try {
    await api('POST', '/api/settings', { displayUrl: url });
    showToast('Display URL updated ✓');
    refreshStatus();
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

// ── Brightness ───────────────────────────────────────────────────────────────

$('brightness-slider').addEventListener('input', (e) => {
  $('brightness-value').textContent = `${e.target.value}%`;
});

$('btn-set-brightness').addEventListener('click', async () => {
  const level = Number($('brightness-slider').value);
  try {
    await api('POST', '/api/brightness', { level });
    showToast(`Brightness set to ${level}% ✓`);
    refreshStatus();
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

$('btn-screen-off').addEventListener('click', async () => {
  try {
    await api('POST', '/api/screen/off');
    showToast('Screen turned off ✓');
    refreshStatus();
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

$('btn-screen-on').addEventListener('click', async () => {
  try {
    await api('POST', '/api/screen/on');
    showToast('Screen turned on ✓');
    refreshStatus();
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

// ── Dimming schedule ─────────────────────────────────────────────────────────

$('dim-level').addEventListener('input', (e) => {
  $('dim-level-value').textContent = `${e.target.value}%`;
});

$('btn-save-dim').addEventListener('click', async () => {
  const payload = {
    dimmingSchedule: {
      enabled:      $('dim-enabled').checked,
      startTime:    $('dim-start').value,
      endTime:      $('dim-end').value,
      dimmingLevel: Number($('dim-level').value),
    },
  };
  try {
    await api('POST', '/api/settings', payload);
    showToast('Dimming schedule saved ✓');
    refreshStatus();
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

// ── Screen-off schedule ──────────────────────────────────────────────────────

$('btn-save-screenoff').addEventListener('click', async () => {
  const payload = {
    screenOffSchedule: {
      enabled: $('screenoff-enabled').checked,
      offTime: $('screenoff-off').value,
      onTime:  $('screenoff-on').value,
    },
  };
  try {
    await api('POST', '/api/settings', payload);
    showToast('Screen-off schedule saved ✓');
    refreshStatus();
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

// ── System controls ──────────────────────────────────────────────────────────

$('btn-restart-app').addEventListener('click', async () => {
  if (!confirm('Restart the application?')) return;
  try {
    await api('POST', '/api/restart');
    showToast('App is restarting…');
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

$('btn-restart-device').addEventListener('click', async () => {
  if (!confirm('Restart the device? It will shut down in 10 seconds.')) return;
  try {
    await api('POST', '/api/restart-device');
    showToast('Device restarting in 10 seconds…');
  } catch (e) {
    showToast(`Error: ${e.message}`, 'danger');
  }
});

// ── Device IP display ────────────────────────────────────────────────────────
$('device-ip').textContent = location.hostname;

// ── Init ─────────────────────────────────────────────────────────────────────
refreshStatus();
setInterval(refreshStatus, 10000);
