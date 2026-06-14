'use strict';

/**
 * Scheduler: checks the current time every minute and applies
 * dimming or screen-off rules from the saved settings.
 */

const settings = require('./settings');
const screenControl = require('./screen-control');

let intervalId = null;
let lastScreenOffState = null;
let lastBrightness = null;

/**
 * Parse "HH:MM" into minutes since midnight.
 */
function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Returns true if `now` (minutes since midnight) is within the
 * [start, end] window, correctly handling overnight ranges (start > end).
 */
function inWindow(now, start, end) {
  if (start <= end) {
    return now >= start && now <= end;
  }
  // Overnight window (e.g. 22:00 – 07:00)
  return now >= start || now <= end;
}

async function tick() {
  const config = settings.get();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // ── Screen-off schedule ──────────────────────────────────────────────────
  const sos = config.screenOffSchedule;
  if (sos.enabled) {
    const offMin = toMinutes(sos.offTime);
    const onMin = toMinutes(sos.onTime);
    const shouldBeOff = inWindow(currentMinutes, offMin, onMin);

    if (shouldBeOff !== lastScreenOffState) {
      lastScreenOffState = shouldBeOff;
      if (shouldBeOff) {
        settings.update({ screenOff: true });
        await screenControl.turnOffScreen().catch(console.error);
      } else {
        settings.update({ screenOff: false });
        await screenControl.turnOnScreen().catch(console.error);
      }
    }
  }

  // ── Dimming schedule ─────────────────────────────────────────────────────
  // Only apply if screen is not scheduled off
  const ds = config.dimmingSchedule;
  if (ds.enabled && !(sos.enabled && lastScreenOffState)) {
    const startMin = toMinutes(ds.startTime);
    const endMin = toMinutes(ds.endTime);
    const shouldDim = inWindow(currentMinutes, startMin, endMin);
    const targetBrightness = shouldDim ? ds.dimmingLevel : config.brightness;

    if (targetBrightness !== lastBrightness) {
      lastBrightness = targetBrightness;
      await screenControl.setBrightness(targetBrightness).catch(console.error);
    }
  }
}

function start() {
  if (intervalId) return;
  // Run once immediately, then every 60 seconds
  tick();
  intervalId = setInterval(tick, 60 * 1000);
}

function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = { start, stop };
