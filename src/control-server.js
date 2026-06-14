'use strict';

/**
 * Local Express web server that provides the remote control UI and REST API.
 * Runs on port 3000 (configurable via env PORT).
 */

const express = require('express');
const path = require('path');
const os = require('os');
const settings = require('./settings');
const screenControl = require('./screen-control');

const PORT = parseInt(process.env.PORT || '3000', 10);

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * @param {() => Electron.BrowserWindow | null} getMainWindow
 */
function startControlServer(getMainWindow) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'control-ui')));

  // ── GET /api/status ──────────────────────────────────────────────────────
  app.get('/api/status', (_req, res) => {
    res.json(settings.get());
  });

  // ── GET /api/settings ────────────────────────────────────────────────────
  app.get('/api/settings', (_req, res) => {
    res.json(settings.get());
  });

  // ── POST /api/settings ───────────────────────────────────────────────────
  app.post('/api/settings', (req, res) => {
    const updated = settings.update(req.body);

    // If URL changed, reload the kiosk window
    if (req.body.displayUrl) {
      const win = getMainWindow();
      if (win) win.loadURL(req.body.displayUrl);
    }

    res.json(updated);
  });

  // ── POST /api/brightness ─────────────────────────────────────────────────
  app.post('/api/brightness', async (req, res) => {
    const level = Number(req.body.level);
    if (isNaN(level) || level < 0 || level > 100) {
      return res.status(400).json({ error: 'level must be 0-100' });
    }
    settings.update({ brightness: level });
    try {
      await screenControl.setBrightness(level);
      res.json({ brightness: level });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/screen/off ─────────────────────────────────────────────────
  app.post('/api/screen/off', async (_req, res) => {
    settings.update({ screenOff: true });
    try {
      await screenControl.turnOffScreen();
      res.json({ screenOff: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/screen/on ──────────────────────────────────────────────────
  app.post('/api/screen/on', async (_req, res) => {
    settings.update({ screenOff: false });
    try {
      await screenControl.turnOnScreen();
      res.json({ screenOff: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/restart ────────────────────────────────────────────────────
  app.post('/api/restart', (_req, res) => {
    res.json({ message: 'Restarting application…' });
    setTimeout(() => {
      const { app: electronApp } = require('electron');
      electronApp.relaunch();
      electronApp.exit(0);
    }, 500);
  });

  // ── POST /api/restart-device ─────────────────────────────────────────────
  app.post('/api/restart-device', (_req, res) => {
    res.json({ message: 'Device will restart in 10 seconds…' });
    setTimeout(() => {
      const { exec } = require('child_process');
      exec('shutdown /r /t 10 /c "Restart from ClockDisplay remote control"');
    }, 500);
  });

  app.listen(PORT, '0.0.0.0', () => {
    const ip = getLocalIP();
    console.log(`[control-server] Remote control UI: http://${ip}:${PORT}`);
  });
}

module.exports = { startControlServer };
