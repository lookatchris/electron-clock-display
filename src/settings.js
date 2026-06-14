'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DEFAULT_SETTINGS = {
  displayUrl: 'https://www.timeanddate.com/clock/fullscreen.html',
  brightness: 100,
  screenOff: false,
  dimmingSchedule: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00',
    dimmingLevel: 20,
  },
  screenOffSchedule: {
    enabled: false,
    offTime: '23:00',
    onTime: '07:00',
  },
};

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function get() {
  const filePath = getSettingsPath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
    }
  } catch (err) {
    console.error('Failed to read settings, using defaults:', err.message);
  }
  return Object.assign({}, DEFAULT_SETTINGS);
}

function update(partial) {
  const current = get();
  // Deep merge for nested objects like dimmingSchedule / screenOffSchedule
  const updated = Object.assign({}, current);
  for (const key of Object.keys(partial)) {
    if (
      typeof partial[key] === 'object' &&
      partial[key] !== null &&
      !Array.isArray(partial[key]) &&
      typeof updated[key] === 'object'
    ) {
      updated[key] = Object.assign({}, updated[key], partial[key]);
    } else {
      updated[key] = partial[key];
    }
  }
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(updated, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save settings:', err.message);
  }
  return updated;
}

module.exports = { get, update, DEFAULT_SETTINGS };
